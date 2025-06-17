
// Order workflow management for seamless order processing
import { enhancedDB } from './enhancedDatabase';
import { SavedOrder } from '@/contexts/OrderContext';

export type OrderStatus = 'saved' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type OrderPriority = 'normal' | 'high' | 'urgent';

export interface OrderWorkflowEvent {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  timestamp: Date;
  userId?: string;
  reason?: string;
  metadata?: any;
}

class OrderWorkflowService {
  private workflowEvents: Map<string, OrderWorkflowEvent[]> = new Map();
  private statusTransitions: Map<OrderStatus, OrderStatus[]> = new Map();
  private statusTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeWorkflow();
  }

  private initializeWorkflow(): void {
    // Define valid status transitions
    this.statusTransitions.set('saved', ['confirmed', 'cancelled']);
    this.statusTransitions.set('confirmed', ['preparing', 'cancelled']);
    this.statusTransitions.set('preparing', ['ready', 'cancelled']);
    this.statusTransitions.set('ready', ['completed', 'cancelled']);
    this.statusTransitions.set('completed', []); // Terminal state
    this.statusTransitions.set('cancelled', []); // Terminal state
  }

  async transitionOrder(orderId: string, toStatus: OrderStatus, reason?: string, userId?: string): Promise<boolean> {
    try {
      // Get current order
      const orders = await enhancedDB.getData('orders');
      const order = orders.find((o: SavedOrder) => o.id === orderId);
      
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      const fromStatus = order.status as OrderStatus;

      // Validate transition
      if (!this.isValidTransition(fromStatus, toStatus)) {
        throw new Error(`Invalid transition from ${fromStatus} to ${toStatus}`);
      }

      // Clear any existing timers
      this.clearStatusTimer(orderId);

      // Log workflow event
      const event: OrderWorkflowEvent = {
        id: this.generateEventId(),
        orderId,
        fromStatus,
        toStatus,
        timestamp: new Date(),
        userId,
        reason
      };

      // Store event
      const events = this.workflowEvents.get(orderId) || [];
      events.push(event);
      this.workflowEvents.set(orderId, events);

      // Update order status
      await enhancedDB.updateItem('orders', orderId, { 
        status: toStatus,
        statusChangedAt: new Date().toISOString(),
        statusChangedBy: userId
      });

      // Handle status-specific logic
      await this.handleStatusChange(order, toStatus);

      // Set status timers for monitoring
      this.setStatusTimer(orderId, toStatus);

      console.log(`Order ${orderId} transitioned from ${fromStatus} to ${toStatus}`);
      return true;
    } catch (error) {
      console.error('Order transition failed:', error);
      return false;
    }
  }

  private isValidTransition(fromStatus: OrderStatus, toStatus: OrderStatus): boolean {
    const validTransitions = this.statusTransitions.get(fromStatus);
    return validTransitions ? validTransitions.includes(toStatus) : false;
  }

  private async handleStatusChange(order: SavedOrder, newStatus: OrderStatus): Promise<void> {
    const { addNotification } = await import('@/contexts/NotificationContext');

    switch (newStatus) {
      case 'confirmed':
        // Send to kitchen, start preparation timer
        await this.notifyKitchen(order);
        break;

      case 'preparing':
        // Update estimated completion time
        const estimatedCompletion = new Date();
        estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + (order.estimatedTime || 15));
        
        await enhancedDB.updateItem('orders', order.id, {
          estimatedCompletion: estimatedCompletion.toISOString(),
          preparationStarted: new Date().toISOString()
        });
        break;

      case 'ready':
        // Notify waiters/billing
        await this.notifyServiceStaff(order);
        break;

      case 'completed':
        // Update inventory, generate analytics data
        await this.updateInventory(order);
        await this.recordOrderAnalytics(order);
        break;

      case 'cancelled':
        // Release table if applicable, refund processing
        if (order.tableNumber) {
          await this.releaseTable(order.tableNumber);
        }
        break;
    }
  }

  private async notifyKitchen(order: SavedOrder): Promise<void> {
    // Trigger kitchen notification
    window.dispatchEvent(new CustomEvent('kitchenOrderReceived', {
      detail: { order }
    }));
  }

  private async notifyServiceStaff(order: SavedOrder): Promise<void> {
    // Trigger service notification
    window.dispatchEvent(new CustomEvent('orderReady', {
      detail: { order }
    }));
  }

  private async updateInventory(order: SavedOrder): Promise<void> {
    try {
      // Update ingredient quantities based on items ordered
      for (const item of order.items) {
        // In a real system, this would update ingredient inventory
        console.log(`Updating inventory for ${item.name} x${item.quantity}`);
      }
    } catch (error) {
      console.error('Failed to update inventory:', error);
    }
  }

  private async recordOrderAnalytics(order: SavedOrder): Promise<void> {
    try {
      // Record order completion data for analytics
      const analyticsData = {
        id: this.generateEventId(),
        orderId: order.id,
        orderType: order.orderType,
        tableNumber: order.tableNumber,
        items: order.items.length,
        revenue: order.total,
        completedAt: new Date().toISOString(),
        preparationTime: this.calculatePreparationTime(order.id),
        waiterName: order.waiterName
      };

      // In a real system, this would be stored in analytics table
      console.log('Recording analytics:', analyticsData);
    } catch (error) {
      console.error('Failed to record analytics:', error);
    }
  }

  private async releaseTable(tableNumber: number): Promise<void> {
    try {
      const tables = await enhancedDB.getData('tables');
      const table = tables.find((t: any) => t.number === tableNumber);
      
      if (table) {
        await enhancedDB.updateItem('tables', table.id.toString(), {
          status: 'cleaning',
          currentOrder: undefined,
          customerCount: undefined
        });
      }
    } catch (error) {
      console.error('Failed to release table:', error);
    }
  }

  private setStatusTimer(orderId: string, status: OrderStatus): void {
    let timeoutDuration = 0;

    switch (status) {
      case 'confirmed':
        timeoutDuration = 2 * 60 * 1000; // 2 minutes to start preparation
        break;
      case 'preparing':
        timeoutDuration = 20 * 60 * 1000; // 20 minutes preparation time
        break;
      case 'ready':
        timeoutDuration = 10 * 60 * 1000; // 10 minutes before order gets cold
        break;
    }

    if (timeoutDuration > 0) {
      const timer = setTimeout(() => {
        this.handleStatusTimeout(orderId, status);
      }, timeoutDuration);

      this.statusTimers.set(orderId, timer);
    }
  }

  private clearStatusTimer(orderId: string): void {
    const timer = this.statusTimers.get(orderId);
    if (timer) {
      clearTimeout(timer);
      this.statusTimers.delete(orderId);
    }
  }

  private handleStatusTimeout(orderId: string, status: OrderStatus): void {
    // Send alert notifications for delayed orders
    window.dispatchEvent(new CustomEvent('orderDelayed', {
      detail: { orderId, status, delayedAt: new Date() }
    }));

    console.warn(`Order ${orderId} delayed in ${status} status`);
  }

  private calculatePreparationTime(orderId: string): number {
    const events = this.workflowEvents.get(orderId) || [];
    const preparingEvent = events.find(e => e.toStatus === 'preparing');
    const readyEvent = events.find(e => e.toStatus === 'ready');

    if (preparingEvent && readyEvent) {
      return readyEvent.timestamp.getTime() - preparingEvent.timestamp.getTime();
    }

    return 0;
  }

  getOrderHistory(orderId: string): OrderWorkflowEvent[] {
    return this.workflowEvents.get(orderId) || [];
  }

  getOrdersInStatus(status: OrderStatus): Promise<SavedOrder[]> {
    return enhancedDB.getData('orders').then(orders => 
      orders.filter((order: SavedOrder) => order.status === status)
    );
  }

  getDelayedOrders(thresholdMinutes: number = 30): Promise<SavedOrder[]> {
    return enhancedDB.getData('orders').then(orders => {
      const threshold = new Date();
      threshold.setMinutes(threshold.getMinutes() - thresholdMinutes);

      return orders.filter((order: SavedOrder) => {
        const orderTime = new Date(order.timestamp);
        return orderTime < threshold && 
               !['completed', 'cancelled'].includes(order.status);
      });
    });
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    // Clear all timers
    this.statusTimers.forEach(timer => clearTimeout(timer));
    this.statusTimers.clear();
  }
}

export const orderWorkflowService = new OrderWorkflowService();

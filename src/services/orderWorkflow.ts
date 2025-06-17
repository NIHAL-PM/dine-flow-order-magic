
import { enhancedDB } from './enhancedDatabase';

// Order workflow service for managing order state transitions
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  requiredFields: string[];
  nextSteps: string[];
  estimatedTime: number;
  autoTransition?: boolean;
}

export interface OrderWorkflowState {
  currentStep: string;
  completedSteps: string[];
  pendingActions: string[];
  estimatedCompletion: Date;
  actualCompletion?: Date;
  alerts: WorkflowAlert[];
}

export interface WorkflowAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

class OrderWorkflowService {
  private workflows: Map<string, WorkflowStep[]> = new Map();
  private orderStates: Map<string, OrderWorkflowState> = new Map();

  constructor() {
    this.initializeWorkflows();
  }

  private initializeWorkflows() {
    // Dine-in workflow
    const dineInWorkflow: WorkflowStep[] = [
      {
        id: 'order_taken',
        name: 'Order Taken',
        description: 'Customer order has been recorded',
        requiredFields: ['items', 'tableNumber', 'waiterName'],
        nextSteps: ['kitchen_confirmed'],
        estimatedTime: 2,
        autoTransition: false
      },
      {
        id: 'kitchen_confirmed',
        name: 'Kitchen Confirmed',
        description: 'Kitchen has received and confirmed the order',
        requiredFields: ['confirmationTime'],
        nextSteps: ['preparing'],
        estimatedTime: 1,
        autoTransition: true
      },
      {
        id: 'preparing',
        name: 'Preparing',
        description: 'Order is being prepared in kitchen',
        requiredFields: ['prepStartTime'],
        nextSteps: ['ready'],
        estimatedTime: 15,
        autoTransition: false
      },
      {
        id: 'ready',
        name: 'Ready to Serve',
        description: 'Order is ready to be served to customer',
        requiredFields: ['readyTime'],
        nextSteps: ['served'],
        estimatedTime: 5,
        autoTransition: false
      },
      {
        id: 'served',
        name: 'Served',
        description: 'Order has been served to customer',
        requiredFields: ['servedTime'],
        nextSteps: ['billing'],
        estimatedTime: 0,
        autoTransition: false
      },
      {
        id: 'billing',
        name: 'Billing',
        description: 'Customer is being billed',
        requiredFields: ['billGeneratedTime'],
        nextSteps: ['completed'],
        estimatedTime: 3,
        autoTransition: false
      },
      {
        id: 'completed',
        name: 'Completed',
        description: 'Order fully completed and paid',
        requiredFields: ['paymentTime'],
        nextSteps: [],
        estimatedTime: 0,
        autoTransition: false
      }
    ];

    this.workflows.set('dine-in', dineInWorkflow);
    this.workflows.set('takeout', dineInWorkflow); // Same workflow for now
    this.workflows.set('delivery', dineInWorkflow); // Same workflow for now
  }

  async initializeOrderWorkflow(orderId: string, orderType: string): Promise<void> {
    const workflow = this.workflows.get(orderType);
    if (!workflow) {
      throw new Error(`Unknown order type: ${orderType}`);
    }

    const initialState: OrderWorkflowState = {
      currentStep: workflow[0].id,
      completedSteps: [],
      pendingActions: [workflow[0].id],
      estimatedCompletion: new Date(Date.now() + this.calculateTotalTime(workflow) * 60000),
      alerts: []
    };

    this.orderStates.set(orderId, initialState);
    await this.saveWorkflowState(orderId, initialState);
  }

  async transitionOrderStep(orderId: string, newStep: string, data?: any): Promise<boolean> {
    try {
      const currentState = this.orderStates.get(orderId);
      if (!currentState) {
        throw new Error(`Order ${orderId} workflow not found`);
      }

      const order = await enhancedDB.getData('orders');
      const orderData = Array.isArray(order) ? order.find((o: any) => o.id === orderId) : null;
      if (!orderData) {
        throw new Error(`Order ${orderId} not found`);
      }

      const workflow = this.workflows.get(orderData.orderType);
      if (!workflow) {
        throw new Error(`Workflow for ${orderData.orderType} not found`);
      }

      const currentStepData = workflow.find(step => step.id === currentState.currentStep);
      const newStepData = workflow.find(step => step.id === newStep);

      if (!currentStepData || !newStepData) {
        throw new Error('Invalid step transition');
      }

      // Validate transition is allowed
      if (!currentStepData.nextSteps.includes(newStep)) {
        throw new Error(`Cannot transition from ${currentState.currentStep} to ${newStep}`);
      }

      // Update order status
      await enhancedDB.updateItem('orders', orderId, {
        status: this.mapStepToOrderStatus(newStep),
        workflowStep: newStep,
        updatedAt: new Date().toISOString(),
        ...data
      });

      // Update workflow state
      const updatedState: OrderWorkflowState = {
        ...currentState,
        currentStep: newStep,
        completedSteps: [...currentState.completedSteps, currentState.currentStep],
        pendingActions: currentState.pendingActions.filter(action => action !== currentState.currentStep)
      };

      if (newStep === 'completed') {
        updatedState.actualCompletion = new Date();
      }

      this.orderStates.set(orderId, updatedState);
      await this.saveWorkflowState(orderId, updatedState);

      // Trigger notifications
      await this.triggerWorkflowNotifications(orderId, newStep, orderData);

      return true;
    } catch (error) {
      console.error('Failed to transition order step:', error);
      return false;
    }
  }

  private async triggerWorkflowNotifications(orderId: string, step: string, orderData: any): Promise<void> {
    try {
      // Dispatch custom event that NotificationContext will listen to
      const notificationEvent = new CustomEvent('orderWorkflowUpdate', {
        detail: {
          orderId,
          step,
          orderData,
          timestamp: new Date()
        }
      });
      
      window.dispatchEvent(notificationEvent);
    } catch (error) {
      console.error('Failed to trigger workflow notifications:', error);
    }
  }

  private mapStepToOrderStatus(step: string): string {
    const statusMap: { [key: string]: string } = {
      'order_taken': 'saved',
      'kitchen_confirmed': 'confirmed',
      'preparing': 'preparing',
      'ready': 'ready',
      'served': 'served',
      'billing': 'billing',
      'completed': 'completed'
    };
    return statusMap[step] || 'saved';
  }

  private calculateTotalTime(workflow: WorkflowStep[]): number {
    return workflow.reduce((total, step) => total + step.estimatedTime, 0);
  }

  private async saveWorkflowState(orderId: string, state: OrderWorkflowState): Promise<void> {
    try {
      const workflowData = {
        id: `workflow_${orderId}`,
        orderId,
        state,
        updatedAt: new Date().toISOString()
      };
      
      const existingWorkflows = await enhancedDB.getData('transactions');
      const existing = Array.isArray(existingWorkflows) ? 
        existingWorkflows.find((w: any) => w.orderId === orderId) : null;
      
      if (existing) {
        await enhancedDB.updateItem('transactions', existing.id, workflowData);
      } else {
        await enhancedDB.addItem('transactions', workflowData);
      }
    } catch (error) {
      console.error('Failed to save workflow state:', error);
    }
  }

  getOrderWorkflowState(orderId: string): OrderWorkflowState | undefined {
    return this.orderStates.get(orderId);
  }

  getNextSteps(orderId: string): WorkflowStep[] {
    const state = this.orderStates.get(orderId);
    if (!state) return [];

    const currentStep = state.currentStep;
    // Implementation would return available next steps
    return [];
  }

  async addWorkflowAlert(orderId: string, alert: Omit<WorkflowAlert, 'id' | 'timestamp' | 'acknowledged'>): Promise<void> {
    const state = this.orderStates.get(orderId);
    if (!state) return;

    const newAlert: WorkflowAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false
    };

    state.alerts.push(newAlert);
    this.orderStates.set(orderId, state);
    await this.saveWorkflowState(orderId, state);
  }
}

export const orderWorkflowService = new OrderWorkflowService();


import { enhancedDB } from './enhancedDatabase';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string; // kg, pieces, liters, etc.
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  averageCost: number;
  lastRestocked: Date;
  expiryDate?: Date;
  supplierId?: string;
  location?: string;
  batchNumber?: string;
  isActive: boolean;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  newStock: number;
  cost?: number;
  reason: string;
  reference?: string; // Order ID, Purchase ID, etc.
  timestamp: Date;
  userId: string;
}

export interface LowStockAlert {
  id: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  minimumStock: number;
  severity: 'low' | 'critical' | 'out_of_stock';
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

class InventoryService {
  private inventory: Map<string, InventoryItem> = new Map();
  private movements: Map<string, StockMovement> = new Map();
  private alerts: Map<string, LowStockAlert> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.loadInventory();
      await this.loadMovements();
      await this.checkLowStock();
      this.startPeriodicChecks();
      this.initialized = true;
      console.log('Inventory service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize inventory service:', error);
    }
  }

  private async loadInventory(): Promise<void> {
    try {
      const inventory = await enhancedDB.getData('inventory');
      if (Array.isArray(inventory)) {
        inventory.forEach(item => {
          this.inventory.set(item.id, {
            ...item,
            lastRestocked: new Date(item.lastRestocked),
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined
          });
        });
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  }

  private async loadMovements(): Promise<void> {
    try {
      const movements = await enhancedDB.getData('transactions');
      if (Array.isArray(movements)) {
        const stockMovements = movements.filter((m: any) => m.type === 'stock_movement');
        stockMovements.forEach(movement => {
          this.movements.set(movement.id, {
            ...movement,
            timestamp: new Date(movement.timestamp)
          });
        });
      }
    } catch (error) {
      console.error('Failed to load stock movements:', error);
    }
  }

  async addInventoryItem(itemData: Omit<InventoryItem, 'id' | 'lastRestocked'>): Promise<string> {
    try {
      const id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const item: InventoryItem = {
        ...itemData,
        id,
        lastRestocked: new Date()
      };

      await enhancedDB.addItem('inventory', item);
      this.inventory.set(id, item);

      // Log initial stock as an adjustment
      if (item.currentStock > 0) {
        await this.recordStockMovement({
          itemId: id,
          type: 'ADJUSTMENT',
          quantity: item.currentStock,
          previousStock: 0,
          newStock: item.currentStock,
          reason: 'Initial stock entry',
          userId: 'system'
        });
      }

      return id;
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      throw error;
    }
  }

  async updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): Promise<void> {
    try {
      const existingItem = this.inventory.get(itemId);
      if (!existingItem) {
        throw new Error('Inventory item not found');
      }

      const updatedItem = { ...existingItem, ...updates };
      
      await enhancedDB.updateItem('inventory', itemId, updatedItem);
      this.inventory.set(itemId, updatedItem);

      // Check if stock levels changed and update alerts
      if (updates.currentStock !== undefined && updates.currentStock !== existingItem.currentStock) {
        await this.checkItemStock(itemId);
      }
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      throw error;
    }
  }

  async recordStockMovement(movementData: Omit<StockMovement, 'id' | 'timestamp'>): Promise<void> {
    try {
      const id = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const movement: StockMovement = {
        ...movementData,
        id,
        timestamp: new Date()
      };

      // Update inventory item stock
      const item = this.inventory.get(movementData.itemId);
      if (!item) {
        throw new Error('Inventory item not found');
      }

      const newStock = movementData.newStock;
      await this.updateInventoryItem(movementData.itemId, {
        currentStock: newStock,
        lastRestocked: movementData.type === 'IN' ? new Date() : item.lastRestocked
      });

      // Save movement record
      await enhancedDB.addItem('transactions', {
        ...movement,
        type: 'stock_movement'
      });
      this.movements.set(id, movement);

      // Check stock levels after movement
      await this.checkItemStock(movementData.itemId);

      // Trigger inventory update notification
      this.triggerInventoryNotification('stock_movement', { movement, item });
    } catch (error) {
      console.error('Failed to record stock movement:', error);
      throw error;
    }
  }

  async consumeStock(itemId: string, quantity: number, reason: string, reference?: string): Promise<boolean> {
    try {
      const item = this.inventory.get(itemId);
      if (!item) {
        throw new Error('Inventory item not found');
      }

      if (item.currentStock < quantity) {
        // Still allow the consumption but create an alert
        await this.createLowStockAlert(item, 'critical');
        console.warn(`Insufficient stock for ${item.name}. Required: ${quantity}, Available: ${item.currentStock}`);
      }

      const newStock = Math.max(0, item.currentStock - quantity);
      
      await this.recordStockMovement({
        itemId,
        type: 'OUT',
        quantity: -quantity,
        previousStock: item.currentStock,
        newStock,
        reason,
        reference,
        userId: 'system'
      });

      return true;
    } catch (error) {
      console.error('Failed to consume stock:', error);
      return false;
    }
  }

  private async checkLowStock(): Promise<void> {
    try {
      for (const item of this.inventory.values()) {
        await this.checkItemStock(item.id);
      }
    } catch (error) {
      console.error('Failed to check low stock:', error);
    }
  }

  private async checkItemStock(itemId: string): Promise<void> {
    try {
      const item = this.inventory.get(itemId);
      if (!item || !item.isActive) return;

      let severity: LowStockAlert['severity'] | null = null;

      if (item.currentStock <= 0) {
        severity = 'out_of_stock';
      } else if (item.currentStock <= item.reorderPoint) {
        severity = 'critical';
      } else if (item.currentStock <= item.minimumStock) {
        severity = 'low';
      }

      if (severity) {
        await this.createLowStockAlert(item, severity);
      } else {
        await this.clearLowStockAlert(itemId);
      }
    } catch (error) {
      console.error('Failed to check item stock:', error);
    }
  }

  private async createLowStockAlert(item: InventoryItem, severity: LowStockAlert['severity']): Promise<void> {
    try {
      // Check if alert already exists for this item
      const existingAlert = Array.from(this.alerts.values())
        .find(alert => alert.itemId === item.id && !alert.acknowledged);

      if (existingAlert) {
        // Update severity if higher
        if (this.getAlertSeverityLevel(severity) > this.getAlertSeverityLevel(existingAlert.severity)) {
          existingAlert.severity = severity;
          await enhancedDB.updateItem('transactions', existingAlert.id, existingAlert);
        }
        return;
      }

      const alert: LowStockAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        itemId: item.id,
        itemName: item.name,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock,
        severity,
        createdAt: new Date(),
        acknowledged: false
      };

      this.alerts.set(alert.id, alert);
      
      await enhancedDB.addItem('transactions', {
        ...alert,
        type: 'low_stock_alert'
      });

      // Trigger notification
      this.triggerInventoryNotification('low_stock_alert', { alert, item });
    } catch (error) {
      console.error('Failed to create low stock alert:', error);
    }
  }

  private async clearLowStockAlert(itemId: string): Promise<void> {
    try {
      const alerts = Array.from(this.alerts.values())
        .filter(alert => alert.itemId === itemId && !alert.acknowledged);

      for (const alert of alerts) {
        alert.acknowledged = true;
        alert.acknowledgedAt = new Date();
        alert.acknowledgedBy = 'system';
        
        await enhancedDB.updateItem('transactions', alert.id, alert);
        this.alerts.set(alert.id, alert);
      }
    } catch (error) {
      console.error('Failed to clear low stock alert:', error);
    }
  }

  private getAlertSeverityLevel(severity: LowStockAlert['severity']): number {
    const levels = { 'low': 1, 'critical': 2, 'out_of_stock': 3 };
    return levels[severity] || 0;
  }

  private startPeriodicChecks(): void {
    // Check stock levels every 30 minutes
    setInterval(() => {
      this.checkLowStock();
    }, 30 * 60 * 1000);

    // Check for expiring items daily
    setInterval(() => {
      this.checkExpiringItems();
    }, 24 * 60 * 60 * 1000);
  }

  private async checkExpiringItems(): Promise<void> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      for (const item of this.inventory.values()) {
        if (!item.expiryDate || !item.isActive) continue;

        const expiryDate = new Date(item.expiryDate);
        
        if (expiryDate <= tomorrow) {
          // Expires within 24 hours
          this.triggerInventoryNotification('expiry_alert', {
            item,
            severity: 'critical',
            message: `${item.name} expires tomorrow`
          });
        } else if (expiryDate <= nextWeek) {
          // Expires within a week
          this.triggerInventoryNotification('expiry_alert', {
            item,
            severity: 'warning',
            message: `${item.name} expires in ${Math.ceil((expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days`
          });
        }
      }
    } catch (error) {
      console.error('Failed to check expiring items:', error);
    }
  }

  private triggerInventoryNotification(type: string, data: any): void {
    const event = new CustomEvent('inventoryUpdate', {
      detail: { type, data, timestamp: new Date() }
    });
    window.dispatchEvent(event);
  }

  // Public methods for accessing data
  getInventoryItems(): InventoryItem[] {
    return Array.from(this.inventory.values())
      .filter(item => item.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getLowStockAlerts(): LowStockAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => this.getAlertSeverityLevel(b.severity) - this.getAlertSeverityLevel(a.severity));
  }

  getItemMovements(itemId: string, limit = 50): StockMovement[] {
    return Array.from(this.movements.values())
      .filter(movement => movement.itemId === itemId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getInventoryValue(): number {
    return Array.from(this.inventory.values())
      .reduce((total, item) => total + (item.currentStock * item.averageCost), 0);
  }

  getItemsNeedingReorder(): InventoryItem[] {
    return Array.from(this.inventory.values())
      .filter(item => item.isActive && item.currentStock <= item.reorderPoint);
  }
}

export const inventoryService = new InventoryService();

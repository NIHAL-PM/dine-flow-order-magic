
import { indexedDBService } from './indexedDBService';
import { syncService } from './syncService';

// Enhanced database service with IndexedDB and sync capabilities
export interface DatabaseSchema {
  orders: any[];
  menuItems: any[];
  categories: any[];
  tables: any[];
  settings: any;
  transactions: any[];
  reservations: any[];
  customers: any[];
  inventory: any[];
}

class EnhancedDatabaseService {
  private subscribers: Map<string, Set<Function>> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      await indexedDBService.initialize();
      
      // Initialize empty tables if they don't exist
      await this.initializeEmptyTables();
      
      this.initialized = true;
      console.log('Enhanced database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize enhanced database:', error);
      throw error;
    }
  }

  private async initializeEmptyTables(): Promise<void> {
    const tables = ['orders', 'menuItems', 'categories', 'tables', 'settings', 'transactions', 'reservations', 'customers', 'inventory'];
    
    for (const table of tables) {
      try {
        const existing = await indexedDBService.getAll(table);
        if (existing.length === 0) {
          // Only initialize default settings, everything else starts empty
          if (table === 'settings') {
            await this.initializeDefaultSettings();
          }
        }
      } catch (error) {
        console.warn(`Could not check existing data for table ${table}:`, error);
      }
    }
  }

  private async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = [
      {
        key: 'restaurant',
        value: {
          name: '',
          address: '',
          phone: '',
          email: '',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          taxRate: 18
        }
      },
      {
        key: 'printing',
        value: {
          enabled: false,
          printerName: '',
          paperSize: '80mm',
          printLogo: false,
          printFooter: true,
          autoKotPrint: true,
          autoBillPrint: false,
          kotCopies: 1,
          billCopies: 1
        }
      },
      {
        key: 'orders',
        value: {
          autoConfirm: false,
          defaultPreparationTime: 15,
          allowEditAfterConfirm: true,
          requireWaiterName: false,
          enablePriority: true,
          maxOrdersPerTable: 5
        }
      },
      {
        key: 'notifications',
        value: {
          soundEnabled: true,
          newOrderAlert: true,
          readyOrderAlert: true,
          lowStockAlert: true,
          reservationReminder: true,
          soundVolume: 0.8,
          emailNotifications: false
        }
      }
    ];

    for (const setting of defaultSettings) {
      try {
        await indexedDBService.put('settings', setting);
      } catch (error) {
        console.warn('Could not initialize default setting:', setting.key, error);
      }
    }
  }

  async getData<K extends keyof DatabaseSchema>(table: K): Promise<DatabaseSchema[K]> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const data = await indexedDBService.getAll(table);
      return data as DatabaseSchema[K];
    } catch (error) {
      console.error(`Failed to get data from ${table}:`, error);
      return [] as DatabaseSchema[K];
    }
  }

  async setData<K extends keyof DatabaseSchema>(table: K, data: DatabaseSchema[K]): Promise<void> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      // Clear existing data
      await indexedDBService.clear(table);
      
      // Add new data - ensure data is iterable
      if (Array.isArray(data)) {
        for (const item of data) {
          await indexedDBService.put(table, item);
        }
      } else if (data && typeof data === 'object') {
        // Handle single object case
        await indexedDBService.put(table, data);
      }

      // Queue sync operation
      syncService.queueOperation({
        type: 'update',
        table,
        data,
        timestamp: new Date()
      });

      this.notifySubscribers(table, data);
      this.logTransaction('BULK_UPDATE', table, data);
    } catch (error) {
      console.error(`Failed to set data for ${table}:`, error);
      throw error;
    }
  }

  async addItem<K extends keyof DatabaseSchema>(table: K, item: any): Promise<void> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const newItem = {
        ...item,
        id: item.id || this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await indexedDBService.put(table, newItem);

      syncService.queueOperation({
        type: 'create',
        table,
        data: newItem,
        timestamp: new Date()
      });

      const allData = await this.getData(table);
      this.notifySubscribers(table, allData);
      this.logTransaction('CREATE', table, newItem);
    } catch (error) {
      console.error(`Failed to add item to ${table}:`, error);
      throw error;
    }
  }

  async updateItem<K extends keyof DatabaseSchema>(table: K, id: string, updates: Partial<any>): Promise<void> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const existing = await indexedDBService.get(table, id);
      if (!existing) {
        throw new Error(`Item with id ${id} not found in ${table}`);
      }

      const updatedItem = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await indexedDBService.put(table, updatedItem);

      syncService.queueOperation({
        type: 'update',
        table,
        data: updatedItem,
        timestamp: new Date()
      });

      const allData = await this.getData(table);
      this.notifySubscribers(table, allData);
      this.logTransaction('UPDATE', table, updatedItem);
    } catch (error) {
      console.error(`Failed to update item in ${table}:`, error);
      throw error;
    }
  }

  async deleteItem<K extends keyof DatabaseSchema>(table: K, id: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      await indexedDBService.delete(table, id);

      syncService.queueOperation({
        type: 'delete',
        table,
        data: { id },
        timestamp: new Date()
      });

      const allData = await this.getData(table);
      this.notifySubscribers(table, allData);
      this.logTransaction('DELETE', table, { id });
    } catch (error) {
      console.error(`Failed to delete item from ${table}:`, error);
      throw error;
    }
  }

  subscribe<K extends keyof DatabaseSchema>(table: K, callback: (data: DatabaseSchema[K]) => void): () => void {
    if (!this.subscribers.has(table)) {
      this.subscribers.set(table, new Set());
    }
    this.subscribers.get(table)!.add(callback);

    return () => {
      this.subscribers.get(table)?.delete(callback);
    };
  }

  private notifySubscribers<K extends keyof DatabaseSchema>(table: K, data: DatabaseSchema[K]): void {
    this.subscribers.get(table)?.forEach(callback => callback(data));
    
    window.dispatchEvent(new CustomEvent('databaseUpdate', { 
      detail: { table, data } 
    }));
  }

  private async logTransaction(type: string, table: string, data: any): Promise<void> {
    try {
      const transaction = {
        id: this.generateId(),
        type,
        table,
        timestamp: new Date().toISOString(),
        dataSnapshot: JSON.stringify(data).substring(0, 500)
      };
      
      await indexedDBService.put('transactions', transaction);
    } catch (error) {
      console.error('Failed to log transaction:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async exportData(): Promise<string> {
    try {
      const allData: any = {};
      const tables = ['orders', 'menuItems', 'categories', 'tables', 'settings', 'reservations', 'customers'];
      
      for (const table of tables) {
        allData[table] = await this.getData(table as keyof DatabaseSchema);
      }
      
      return JSON.stringify(allData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      for (const [table, tableData] of Object.entries(data)) {
        if (tableData && Array.isArray(tableData)) {
          await this.setData(table as keyof DatabaseSchema, tableData);
        }
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      const tables = ['orders', 'menuItems', 'categories', 'tables', 'reservations', 'customers', 'inventory'];
      
      for (const table of tables) {
        await indexedDBService.clear(table);
      }
      
      await this.initializeDefaultSettings();
      
      for (const table of tables) {
        this.notifySubscribers(table as keyof DatabaseSchema, []);
      }
      
      console.log('All data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }

  getSyncStatus() {
    return syncService.getStatus();
  }
}

export const enhancedDB = new EnhancedDatabaseService();

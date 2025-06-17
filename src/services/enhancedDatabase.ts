
import { indexedDBService } from './indexedDBService';
import { syncService } from './syncService';
import { dataValidationService } from './dataValidation';
import { transactionLogger } from './transactionLogger';
import { backupService } from './backupService';
import { conflictResolutionService } from './conflictResolution';

// Enhanced database service with IndexedDB and sync capabilities
export interface DatabaseSchema {
  orders: any[];
  menuItems: any[];
  categories: any[];
  tables: any[];
  settings: any[];
  transactions: any[];
  reservations: any[];
  customers: any[];
  inventory: any[];
}

class EnhancedDatabaseService {
  private subscribers: Map<string, Set<Function>> = new Map();
  private initialized = false;
  private retryAttempts = 3;
  private retryDelay = 1000;

  async initialize(): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.retryAttempts) {
      try {
        await indexedDBService.initialize();
        await this.initializeEmptyTables();
        await this.performIntegrityCheck();
        
        this.initialized = true;
        console.log('Enhanced database initialized successfully');
        return;
      } catch (error) {
        attempts++;
        console.error(`Database initialization attempt ${attempts} failed:`, error);
        
        if (attempts < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempts));
        } else {
          throw error;
        }
      }
    }
  }

  private async initializeEmptyTables(): Promise<void> {
    const tables = ['orders', 'menuItems', 'categories', 'tables', 'settings', 'transactions', 'reservations', 'customers', 'inventory'];
    
    for (const table of tables) {
      try {
        const existing = await indexedDBService.getAll(table);
        if (existing.length === 0 && table === 'settings') {
          await this.initializeDefaultSettings();
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

  private async performIntegrityCheck(): Promise<void> {
    try {
      // Check for data corruption
      const tables = ['orders', 'menuItems', 'categories', 'tables', 'settings'];
      const issues: string[] = [];

      for (const table of tables) {
        try {
          const data = await indexedDBService.getAll(table);
          
          // Check for duplicate IDs
          const ids = data.map((item: any) => item.id).filter(Boolean);
          const uniqueIds = new Set(ids);
          if (ids.length !== uniqueIds.size) {
            issues.push(`Duplicate IDs found in ${table}`);
          }

          // Validate data structure
          for (const item of data) {
            const validation = dataValidationService.validate(table, item);
            if (!validation.isValid) {
              issues.push(`Invalid data in ${table}: ${validation.errors.join(', ')}`);
            }
          }
        } catch (error) {
          issues.push(`Cannot access table ${table}: ${error}`);
        }
      }

      if (issues.length > 0) {
        console.warn('Data integrity issues found:', issues);
        // In production, you might want to trigger a backup restoration
      }
    } catch (error) {
      console.error('Integrity check failed:', error);
    }
  }

  async getData<K extends keyof DatabaseSchema>(table: K): Promise<DatabaseSchema[K]> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const data = await indexedDBService.getAll(table);
      return (Array.isArray(data) ? data : []) as DatabaseSchema[K];
    } catch (error) {
      console.error(`Failed to get data from ${table}:`, error);
      return [] as DatabaseSchema[K];
    }
  }

  async setData<K extends keyof DatabaseSchema>(table: K, data: DatabaseSchema[K]): Promise<void> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const transactionId = transactionLogger.logTransaction('BULK_UPDATE', table, data);

    try {
      // Validate data before saving
      if (Array.isArray(data)) {
        for (const item of data) {
          const validation = dataValidationService.validate(table, item);
          if (!validation.isValid) {
            throw new Error(`Invalid data: ${validation.errors.join(', ')}`);
          }
        }
      }

      // Clear existing data
      await indexedDBService.clear(table);
      
      // Add new data
      if (Array.isArray(data)) {
        for (const item of data) {
          await indexedDBService.put(table, item);
        }
      } else if (data && typeof data === 'object') {
        await indexedDBService.put(table, data);
      }

      // Queue sync operation
      syncService.queueOperation({
        type: 'update',
        table,
        data,
        timestamp: new Date()
      });

      transactionLogger.completeTransaction(transactionId);
      this.notifySubscribers(table, data);
    } catch (error) {
      transactionLogger.failTransaction(transactionId, error instanceof Error ? error.message : 'Unknown error');
      console.error(`Failed to set data for ${table}:`, error);
      throw error;
    }
  }

  async addItem<K extends keyof DatabaseSchema>(table: K, item: any): Promise<void> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    // Validate data
    const validation = dataValidationService.validate(table, item);
    if (!validation.isValid) {
      throw new Error(`Invalid data: ${validation.errors.join(', ')}`);
    }

    const transactionId = transactionLogger.logTransaction('CREATE', table, item, item.id);

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

      transactionLogger.completeTransaction(transactionId);
      const allData = await this.getData(table);
      this.notifySubscribers(table, allData);
    } catch (error) {
      transactionLogger.failTransaction(transactionId, error instanceof Error ? error.message : 'Unknown error');
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

      // Validate updated data
      const validation = dataValidationService.validate(table, updatedItem);
      if (!validation.isValid) {
        throw new Error(`Invalid data: ${validation.errors.join(', ')}`);
      }

      const transactionId = transactionLogger.logTransaction('UPDATE', table, updatedItem, id, existing);

      await indexedDBService.put(table, updatedItem);

      syncService.queueOperation({
        type: 'update',
        table,
        data: updatedItem,
        timestamp: new Date()
      });

      transactionLogger.completeTransaction(transactionId);
      const allData = await this.getData(table);
      this.notifySubscribers(table, allData);
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
      const existing = await indexedDBService.get(table, id);
      const transactionId = transactionLogger.logTransaction('DELETE', table, { id }, id, existing);

      await indexedDBService.delete(table, id);

      syncService.queueOperation({
        type: 'delete',
        table,
        data: { id },
        timestamp: new Date()
      });

      transactionLogger.completeTransaction(transactionId);
      const allData = await this.getData(table);
      this.notifySubscribers(table, allData);
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

  // Backup and recovery methods
  async createBackup(): Promise<string> {
    return await backupService.createBackup('manual');
  }

  async restoreBackup(backupId: string): Promise<void> {
    await backupService.restoreBackup(backupId);
    
    // Refresh all subscribers after restore
    const tables = ['orders', 'menuItems', 'categories', 'tables', 'settings', 'reservations', 'customers', 'inventory'];
    for (const table of tables) {
      const data = await this.getData(table as keyof DatabaseSchema);
      this.notifySubscribers(table as keyof DatabaseSchema, data);
    }
  }

  getBackups() {
    return backupService.getBackups();
  }

  // Transaction and conflict resolution methods
  getTransactionHistory() {
    return transactionLogger.getTransactionHistory();
  }

  async rollbackTransaction(transactionId: string): Promise<boolean> {
    return await transactionLogger.rollbackTransaction(transactionId);
  }

  getPendingConflicts() {
    return conflictResolutionService.getPendingConflicts();
  }

  resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merge', mergedData?: any) {
    return conflictResolutionService.resolveConflict(conflictId, resolution, mergedData);
  }

  getSyncStatus() {
    return syncService.getStatus();
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const enhancedDB = new EnhancedDatabaseService();

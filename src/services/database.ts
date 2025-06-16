
// Centralized database service for local storage with sync capabilities
export interface DatabaseSchema {
  orders: any[];
  menuItems: any[];
  categories: any[];
  tables: any[];
  settings: any;
  transactions: any[];
  reservations: any[];
  reports: any[];
}

class DatabaseService {
  private dbName = 'restaurant_db';
  private version = 1;
  private subscribers: Map<string, Set<Function>> = new Map();

  // Initialize database with default data
  initialize(): DatabaseSchema {
    const defaultData: DatabaseSchema = {
      orders: [],
      menuItems: this.getDefaultMenuItems(),
      categories: this.getDefaultCategories(),
      tables: this.getDefaultTables(),
      settings: this.getDefaultSettings(),
      transactions: [],
      reservations: [],
      reports: []
    };

    // Load existing data or create default
    Object.keys(defaultData).forEach(key => {
      const existing = localStorage.getItem(`${this.dbName}_${key}`);
      if (!existing) {
        this.setData(key as keyof DatabaseSchema, defaultData[key as keyof DatabaseSchema]);
      }
    });

    return this.getAllData();
  }

  // Get data with type safety
  getData<K extends keyof DatabaseSchema>(table: K): DatabaseSchema[K] {
    const data = localStorage.getItem(`${this.dbName}_${table}`);
    return data ? JSON.parse(data) : [];
  }

  // Set data with automatic sync
  setData<K extends keyof DatabaseSchema>(table: K, data: DatabaseSchema[K]): void {
    localStorage.setItem(`${this.dbName}_${table}`, JSON.stringify(data));
    this.notifySubscribers(table, data);
    this.logTransaction('UPDATE', table, data);
  }

  // Add single item
  addItem<K extends keyof DatabaseSchema>(table: K, item: any): void {
    const currentData = this.getData(table) as any[];
    const newData = [...currentData, { ...item, id: this.generateId(), createdAt: new Date().toISOString() }];
    this.setData(table, newData as DatabaseSchema[K]);
  }

  // Update single item
  updateItem<K extends keyof DatabaseSchema>(table: K, id: string, updates: Partial<any>): void {
    const currentData = this.getData(table) as any[];
    const newData = currentData.map(item => 
      item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
    );
    this.setData(table, newData as DatabaseSchema[K]);
  }

  // Delete single item
  deleteItem<K extends keyof DatabaseSchema>(table: K, id: string): void {
    const currentData = this.getData(table) as any[];
    const newData = currentData.filter(item => item.id !== id);
    this.setData(table, newData as DatabaseSchema[K]);
  }

  // Subscribe to data changes
  subscribe<K extends keyof DatabaseSchema>(table: K, callback: (data: DatabaseSchema[K]) => void): () => void {
    if (!this.subscribers.has(table)) {
      this.subscribers.set(table, new Set());
    }
    this.subscribers.get(table)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(table)?.delete(callback);
    };
  }

  // Notify subscribers of changes
  private notifySubscribers<K extends keyof DatabaseSchema>(table: K, data: DatabaseSchema[K]): void {
    this.subscribers.get(table)?.forEach(callback => callback(data));
    
    // Global data change event
    window.dispatchEvent(new CustomEvent('databaseUpdate', { 
      detail: { table, data } 
    }));
  }

  // Transaction logging for audit trail
  private logTransaction(type: string, table: string, data: any): void {
    const transaction = {
      id: this.generateId(),
      type,
      table,
      timestamp: new Date().toISOString(),
      dataSnapshot: JSON.stringify(data).substring(0, 500) // Truncate large data
    };
    
    const transactions = this.getData('transactions');
    const newTransactions = [...transactions, transaction].slice(-1000); // Keep last 1000
    localStorage.setItem(`${this.dbName}_transactions`, JSON.stringify(newTransactions));
  }

  // Offline sync detection and handling
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Generate unique IDs
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get all data
  getAllData(): DatabaseSchema {
    return {
      orders: this.getData('orders'),
      menuItems: this.getData('menuItems'),
      categories: this.getData('categories'),
      tables: this.getData('tables'),
      settings: this.getData('settings'),
      transactions: this.getData('transactions'),
      reservations: this.getData('reservations'),
      reports: this.getData('reports')
    };
  }

  // Backup and restore functionality
  exportData(): string {
    return JSON.stringify(this.getAllData());
  }

  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      Object.entries(data).forEach(([table, tableData]) => {
        this.setData(table as keyof DatabaseSchema, tableData);
      });
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Invalid data format');
    }
  }

  // Clear all data
  clearAllData(): void {
    Object.keys(this.getAllData()).forEach(table => {
      localStorage.removeItem(`${this.dbName}_${table}`);
    });
    this.initialize();
  }

  // Default data generators
  private getDefaultMenuItems() {
    return [
      { id: '1', name: 'Samosa', description: 'Crispy pastry with spiced filling', price: 45, category: 'appetizers', available: true, preparationTime: 10, dietary: ['vegetarian'] },
      { id: '2', name: 'Pakora', description: 'Mixed vegetable fritters', price: 65, category: 'appetizers', available: true, preparationTime: 12, dietary: ['vegetarian'] },
      { id: '3', name: 'Spring Roll', description: 'Crispy vegetable spring rolls', price: 85, category: 'appetizers', available: true, preparationTime: 15, dietary: ['vegetarian'] },
      { id: '4', name: 'Butter Chicken', description: 'Creamy tomato curry with chicken', price: 280, category: 'mains', available: true, preparationTime: 25 },
      { id: '5', name: 'Dal Makhani', description: 'Rich black lentil curry', price: 220, category: 'mains', available: true, preparationTime: 20, dietary: ['vegetarian'] },
      { id: '6', name: 'Biryani', description: 'Fragrant rice with spices and meat', price: 320, category: 'mains', available: true, preparationTime: 30 },
      { id: '7', name: 'Lassi', description: 'Traditional yogurt drink', price: 65, category: 'beverages', available: true, preparationTime: 5, dietary: ['vegetarian'] },
      { id: '8', name: 'Tea', description: 'Hot masala chai', price: 25, category: 'beverages', available: true, preparationTime: 5, dietary: ['vegetarian'] },
      { id: '9', name: 'Cold Coffee', description: 'Iced coffee with cream', price: 85, category: 'beverages', available: true, preparationTime: 8 },
      { id: '10', name: 'Gulab Jamun', description: 'Sweet milk dumplings in syrup', price: 95, category: 'desserts', available: true, preparationTime: 5, dietary: ['vegetarian'] }
    ];
  }

  private getDefaultCategories() {
    return [
      { id: 'appetizers', name: 'Appetizers', description: 'Start your meal', order: 1, active: true },
      { id: 'mains', name: 'Main Course', description: 'Our signature dishes', order: 2, active: true },
      { id: 'beverages', name: 'Beverages', description: 'Refreshing drinks', order: 3, active: true },
      { id: 'desserts', name: 'Desserts', description: 'Sweet endings', order: 4, active: true }
    ];
  }

  private getDefaultTables() {
    const tables = [];
    for (let i = 1; i <= 20; i++) {
      tables.push({
        id: i,
        number: i,
        capacity: i <= 10 ? 4 : i <= 15 ? 6 : 8,
        status: 'available'
      });
    }
    return tables;
  }

  private getDefaultSettings() {
    return {
      restaurant: {
        name: 'Restaurant Management System',
        address: '123 Main Street, City',
        phone: '+1 234 567 8900',
        email: 'info@restaurant.com',
        currency: 'INR',
        timezone: 'Asia/Kolkata'
      },
      printing: {
        enabled: true,
        printerName: 'Default Thermal Printer',
        paperSize: '80mm',
        printLogo: true,
        printFooter: true
      },
      orders: {
        autoConfirm: false,
        defaultPreparationTime: 15,
        allowEditAfterConfirm: true,
        requireWaiterName: false
      },
      notifications: {
        soundEnabled: true,
        newOrderAlert: true,
        readyOrderAlert: true,
        lowStockAlert: true
      }
    };
  }
}

// Export singleton instance
export const db = new DatabaseService();

// Initialize on first import
db.initialize();

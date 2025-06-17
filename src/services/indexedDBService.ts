
// IndexedDB service for local data storage
class IndexedDBService {
  private db: IDBDatabase | null = null;
  private dbName = 'RestaurantDB';
  private version = 2; // Increased version to add inventory table

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores if they don't exist
        const stores = ['orders', 'menuItems', 'categories', 'tables', 'settings', 'transactions', 'reservations', 'customers', 'inventory'];
        
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('id', 'id', { unique: true });
            
            // Add specific indexes for different stores
            if (storeName === 'orders') {
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('tableNumber', 'tableNumber', { unique: false });
            } else if (storeName === 'inventory') {
              store.createIndex('category', 'category', { unique: false });
              store.createIndex('isActive', 'isActive', { unique: false });
            } else if (storeName === 'reservations') {
              store.createIndex('date', 'date', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            }
          }
        });
      };
    });
  }

  async put(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(new Error(`Failed to put data in ${storeName}`));
      request.onsuccess = () => resolve();
    });
  }

  async get(storeName: string, id: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(new Error(`Failed to get data from ${storeName}`));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      if (!this.db!.objectStoreNames.contains(storeName)) {
        reject(new Error(`Object store ${storeName} does not exist`));
        return;
      }

      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(new Error(`Failed to get all data from ${storeName}`));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(new Error(`Failed to delete from ${storeName}`));
      request.onsuccess = () => resolve();
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
      request.onsuccess = () => resolve();
    });
  }
}

export const indexedDBService = new IndexedDBService();


// Sync service for offline/online data synchronization
class SyncService {
  private syncQueue: any[] = [];
  private isOnline = navigator.onLine;
  private lastSync: Date | null = null;

  constructor() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline() {
    this.isOnline = true;
    this.processSyncQueue();
    this.notifyStatusChange();
  }

  private handleOffline() {
    this.isOnline = false;
    this.notifyStatusChange();
  }

  queueOperation(operation: {
    type: 'create' | 'update' | 'delete';
    table: string;
    data: any;
    timestamp: Date;
  }) {
    this.syncQueue.push({
      ...operation,
      id: this.generateId()
    });
    
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  private async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    try {
      // Process queued operations
      const operations = [...this.syncQueue];
      this.syncQueue = [];

      // In a real implementation, this would sync with a server
      // For now, we'll just mark as processed
      console.log('Processing sync queue:', operations);
      
      this.lastSync = new Date();
      this.notifyStatusChange();
    } catch (error) {
      console.error('Sync failed:', error);
      // Re-queue failed operations
    }
  }

  private notifyStatusChange() {
    window.dispatchEvent(new CustomEvent('syncStatusChange', {
      detail: {
        isOnline: this.isOnline,
        lastSync: this.lastSync,
        queueLength: this.syncQueue.length
      }
    }));
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      lastSync: this.lastSync,
      queueLength: this.syncQueue.length
    };
  }
}

export const syncService = new SyncService();

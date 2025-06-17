
// Backup and recovery service for data protection
export interface BackupMetadata {
  id: string;
  timestamp: Date;
  version: string;
  tables: string[];
  size: number;
  checksum: string;
  type: 'manual' | 'automatic';
}

class BackupService {
  private backups: Map<string, BackupMetadata> = new Map();
  private maxBackups = 10;
  private autoBackupInterval = 30 * 60 * 1000; // 30 minutes
  private autoBackupTimer?: NodeJS.Timeout;

  constructor() {
    this.startAutoBackup();
  }

  async createBackup(type: 'manual' | 'automatic' = 'manual'): Promise<string> {
    try {
      const backupId = this.generateBackupId();
      const timestamp = new Date();
      
      // Get all data from IndexedDB
      const { enhancedDB } = await import('./enhancedDatabase');
      const tables = ['orders', 'menuItems', 'categories', 'tables', 'settings', 'reservations', 'customers', 'inventory'];
      const backupData: any = {};
      
      for (const table of tables) {
        try {
          backupData[table] = await enhancedDB.getData(table as any);
        } catch (error) {
          console.warn(`Failed to backup table ${table}:`, error);
          backupData[table] = [];
        }
      }

      const dataString = JSON.stringify(backupData);
      const checksum = await this.calculateChecksum(dataString);
      
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        version: '1.0.0',
        tables,
        size: dataString.length,
        checksum,
        type
      };

      // Store backup in localStorage
      localStorage.setItem(`backup_${backupId}`, dataString);
      localStorage.setItem(`backup_meta_${backupId}`, JSON.stringify(metadata));
      
      this.backups.set(backupId, metadata);
      this.cleanupOldBackups();
      
      console.log(`Backup created successfully: ${backupId}`);
      return backupId;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  async restoreBackup(backupId: string): Promise<void> {
    try {
      const metadata = this.backups.get(backupId);
      if (!metadata) {
        throw new Error(`Backup ${backupId} not found`);
      }

      const backupData = localStorage.getItem(`backup_${backupId}`);
      if (!backupData) {
        throw new Error(`Backup data for ${backupId} not found`);
      }

      // Verify checksum
      const checksum = await this.calculateChecksum(backupData);
      if (checksum !== metadata.checksum) {
        throw new Error(`Backup ${backupId} is corrupted`);
      }

      const data = JSON.parse(backupData);
      const { enhancedDB } = await import('./enhancedDatabase');

      // Restore each table
      for (const [table, tableData] of Object.entries(data)) {
        if (Array.isArray(tableData)) {
          await enhancedDB.setData(table as any, tableData);
        }
      }

      console.log(`Backup restored successfully: ${backupId}`);
    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw error;
    }
  }

  getBackups(): BackupMetadata[] {
    return Array.from(this.backups.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      localStorage.removeItem(`backup_${backupId}`);
      localStorage.removeItem(`backup_meta_${backupId}`);
      this.backups.delete(backupId);
      console.log(`Backup deleted: ${backupId}`);
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }

  async exportBackup(backupId: string): Promise<string> {
    const backupData = localStorage.getItem(`backup_${backupId}`);
    if (!backupData) {
      throw new Error(`Backup ${backupId} not found`);
    }
    return backupData;
  }

  async importBackup(backupData: string): Promise<string> {
    try {
      // Validate backup data
      const data = JSON.parse(backupData);
      const checksum = await this.calculateChecksum(backupData);
      
      const backupId = this.generateBackupId();
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        version: '1.0.0',
        tables: Object.keys(data),
        size: backupData.length,
        checksum,
        type: 'manual'
      };

      localStorage.setItem(`backup_${backupId}`, backupData);
      localStorage.setItem(`backup_meta_${backupId}`, JSON.stringify(metadata));
      this.backups.set(backupId, metadata);

      return backupId;
    } catch (error) {
      console.error('Failed to import backup:', error);
      throw error;
    }
  }

  private startAutoBackup(): void {
    this.autoBackupTimer = setInterval(async () => {
      try {
        await this.createBackup('automatic');
      } catch (error) {
        console.error('Auto backup failed:', error);
      }
    }, this.autoBackupInterval);
  }

  private cleanupOldBackups(): void {
    const backups = this.getBackups();
    if (backups.length <= this.maxBackups) return;

    const toDelete = backups.slice(this.maxBackups);
    toDelete.forEach(backup => {
      this.deleteBackup(backup.id);
    });
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  destroy(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
    }
  }
}

export const backupService = new BackupService();

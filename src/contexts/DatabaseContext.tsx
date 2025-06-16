
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { enhancedDB } from '@/services/enhancedDatabase';
import { syncService } from '@/services/syncService';

interface DatabaseContextType {
  isOnline: boolean;
  lastSync: Date | null;
  pendingSync: boolean;
  syncData: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  initialized: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingSync, setPendingSync] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await enhancedDB.initialize();
        setInitialized(true);
        console.log('Database context initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database context:', error);
      }
    };

    initializeDatabase();

    const handleSyncStatusChange = (event: CustomEvent) => {
      const { isOnline, lastSync, queueLength } = event.detail;
      setIsOnline(isOnline);
      setLastSync(lastSync);
      setPendingSync(queueLength > 0);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('syncStatusChange', handleSyncStatusChange as EventListener);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('syncStatusChange', handleSyncStatusChange as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = async () => {
    if (!navigator.onLine) return;
    
    setPendingSync(true);
    try {
      // Get current sync status
      const status = enhancedDB.getSyncStatus();
      setLastSync(status.lastSync);
      console.log('Data sync completed');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setPendingSync(false);
    }
  };

  const exportData = async () => {
    try {
      return await enhancedDB.exportData();
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export data');
    }
  };

  const importData = async (data: string) => {
    try {
      await enhancedDB.importData(data);
      await syncData();
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Failed to import data');
    }
  };

  const clearAllData = async () => {
    try {
      await enhancedDB.clearAllData();
      setLastSync(null);
      console.log('All data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  };

  return (
    <DatabaseContext.Provider value={{
      isOnline,
      lastSync,
      pendingSync,
      syncData,
      exportData,
      importData,
      clearAllData,
      initialized
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};


import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/services/database';

interface DatabaseContextType {
  isOnline: boolean;
  lastSync: Date | null;
  pendingSync: boolean;
  syncData: () => Promise<void>;
  exportData: () => string;
  importData: (data: string) => Promise<void>;
  clearAllData: () => void;
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

  useEffect(() => {
    // Initialize database on mount
    try {
      db.initialize();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }

    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online
    if (navigator.onLine) {
      syncData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = async () => {
    if (!navigator.onLine) return;
    
    setPendingSync(true);
    try {
      // Simulate sync process - in real app this would sync with server
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSync(new Date());
      console.log('Data synced successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setPendingSync(false);
    }
  };

  const exportData = () => {
    try {
      return db.exportData();
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export data');
    }
  };

  const importData = async (data: string) => {
    try {
      db.importData(data);
      await syncData();
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Failed to import data');
    }
  };

  const clearAllData = () => {
    try {
      db.clearAllData();
      setLastSync(null);
      console.log('All data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
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
      clearAllData
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

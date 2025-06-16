
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
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = async () => {
    setPendingSync(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setPendingSync(false);
    }
  };

  const exportData = () => {
    return db.exportData();
  };

  const importData = async (data: string) => {
    try {
      db.importData(data);
      await syncData();
    } catch (error) {
      throw new Error('Failed to import data');
    }
  };

  const clearAllData = () => {
    db.clearAllData();
    setLastSync(null);
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

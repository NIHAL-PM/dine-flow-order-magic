
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, CloudOff, Cloud } from 'lucide-react';
import { useDatabaseContext } from '@/contexts/DatabaseContext';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Safely access the database context
  let lastSync = null;
  let pendingSync = false;
  
  try {
    const { lastSync: dbLastSync, pendingSync: dbPendingSync } = useDatabaseContext();
    lastSync = dbLastSync;
    pendingSync = dbPendingSync;
  } catch (error) {
    // If context is not available, use default values
    console.log('Database context not available, using defaults');
  }

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !pendingSync) {
    return null; // Don't show indicator when online and synced
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center gap-2 px-3 py-2"
      >
        {isOnline ? (
          <>
            {pendingSync ? <CloudOff className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
            {pendingSync ? 'Syncing...' : 'Online'}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            Offline Mode
          </>
        )}
      </Badge>
      {lastSync && (
        <p className="text-xs text-gray-500 mt-1 text-center">
          Last sync: {lastSync.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default OfflineIndicator;

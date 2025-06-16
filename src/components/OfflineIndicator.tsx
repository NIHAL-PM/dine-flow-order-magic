
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, CloudOff, Cloud, AlertCircle } from 'lucide-react';
import { useDatabaseContext } from '@/contexts/DatabaseContext';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  let lastSync = null;
  let pendingSync = false;
  let initialized = false;
  
  try {
    const { lastSync: dbLastSync, pendingSync: dbPendingSync, initialized: dbInitialized } = useDatabaseContext();
    lastSync = dbLastSync;
    pendingSync = dbPendingSync;
    initialized = dbInitialized;
  } catch (error) {
    console.log('Database context not available');
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

  if (!initialized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="secondary" className="flex items-center gap-2 px-3 py-2 animate-pulse">
          <AlertCircle className="h-4 w-4" />
          Initializing...
        </Badge>
      </div>
    );
  }

  if (isOnline && !pendingSync) {
    return null;
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

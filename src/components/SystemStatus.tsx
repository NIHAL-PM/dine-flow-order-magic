
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  Printer, 
  Server, 
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { printService } from '@/services/printService';

interface SystemStatusProps {
  className?: string;
}

const SystemStatus = ({ className }: SystemStatusProps) => {
  const [status, setStatus] = useState({
    internet: true,
    thermalPrinter: false,
    database: true,
    server: true,
    lastUpdated: new Date()
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkSystemStatus = async () => {
    setIsRefreshing(true);
    
    try {
      // Check internet connection
      const internetStatus = navigator.onLine;
      
      // Check thermal printer
      const printerStatus = await printService.checkThermalPrinter();
      
      // Simulate other system checks
      const databaseStatus = true; // Would check actual database connection
      const serverStatus = true; // Would check server health
      
      setStatus({
        internet: internetStatus,
        thermalPrinter: printerStatus,
        database: databaseStatus,
        server: serverStatus,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('System status check failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isOnline: boolean) => {
    if (isOnline) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (isOnline: boolean) => {
    return (
      <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
        {isOnline ? "Online" : "Offline"}
      </Badge>
    );
  };

  const statusItems = [
    {
      label: "Internet",
      icon: status.internet ? Wifi : WifiOff,
      status: status.internet,
      description: status.internet ? "Connected" : "Disconnected"
    },
    {
      label: "Thermal Printer",
      icon: Printer,
      status: status.thermalPrinter,
      description: status.thermalPrinter ? "Ready" : "Not connected"
    },
    {
      label: "Database",
      icon: Database,
      status: status.database,
      description: status.database ? "Connected" : "Connection failed"
    },
    {
      label: "Server",
      icon: Server,
      status: status.server,
      description: status.server ? "Running" : "Down"
    }
  ];

  const allSystemsOperational = Object.values(status).every(s => s === true || s instanceof Date);

  return (
    <Card className={`glass-effect ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={allSystemsOperational ? "default" : "destructive"}
              className="text-xs"
            >
              {allSystemsOperational ? "All Systems Operational" : "Issues Detected"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkSystemStatus}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className={`h-4 w-4 ${item.status ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">{item.description}</span>
                {getStatusIcon(item.status)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last updated</span>
            <span>{status.lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;

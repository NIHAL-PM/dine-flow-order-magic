
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Order {
  id: string;
  tokenNumber: string;
  type: 'dine-in' | 'takeout' | 'delivery';
  tableNumber?: number;
  items: Array<{
    name: string;
    quantity: number;
    notes?: string;
  }>;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  timeOrdered: Date;
  estimatedTime: number; // minutes
}

const KitchenDisplay = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      tokenNumber: 'D-001',
      type: 'dine-in',
      tableNumber: 5,
      items: [
        { name: 'Margherita Pizza', quantity: 1 },
        { name: 'Caesar Salad', quantity: 2, notes: 'No croutons' }
      ],
      status: 'pending',
      timeOrdered: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      estimatedTime: 15
    },
    {
      id: '2',
      tokenNumber: 'T-001',
      type: 'takeout',
      items: [
        { name: 'Chicken Burger', quantity: 2 },
        { name: 'Coca Cola', quantity: 2 }
      ],
      status: 'preparing',
      timeOrdered: new Date(Date.now() - 8 * 60000), // 8 minutes ago
      estimatedTime: 10
    },
    {
      id: '3',
      tokenNumber: 'DEL-001',
      type: 'delivery',
      items: [
        { name: 'Chocolate Cake', quantity: 1 },
        { name: 'Margherita Pizza', quantity: 1 }
      ],
      status: 'ready',
      timeOrdered: new Date(Date.now() - 12 * 60000), // 12 minutes ago
      estimatedTime: 20
    }
  ]);

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const getElapsedTime = (timeOrdered: Date) => {
    const elapsed = Math.floor((Date.now() - timeOrdered.getTime()) / 60000);
    return elapsed;
  };

  const getStatusColor = (status: Order['status'], elapsedTime: number, estimatedTime: number) => {
    if (status === 'completed') return 'bg-gray-100 border-gray-300';
    if (status === 'ready') return 'bg-blue-50 border-blue-300';
    if (elapsedTime > estimatedTime) return 'bg-red-50 border-red-300';
    if (elapsedTime > estimatedTime * 0.8) return 'bg-yellow-50 border-yellow-300';
    return 'bg-green-50 border-green-300';
  };

  const getStatusBadge = (status: Order['status']) => {
    const configs = {
      pending: { label: 'Pending', variant: 'destructive' as const, icon: AlertCircle },
      preparing: { label: 'Preparing', variant: 'default' as const, icon: Clock },
      ready: { label: 'Ready', variant: 'secondary' as const, icon: CheckCircle },
      completed: { label: 'Completed', variant: 'outline' as const, icon: CheckCircle }
    };
    
    const config = configs[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: Order['type']) => {
    const colors = {
      'dine-in': 'bg-blue-500',
      'takeout': 'bg-green-500',
      'delivery': 'bg-orange-500'
    };
    
    return (
      <div className={`w-3 h-3 rounded-full ${colors[type]}`} title={type} />
    );
  };

  const activeOrders = orders.filter(order => order.status !== 'completed');
  const completedOrders = orders.filter(order => order.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Kitchen Display System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Active Orders: {activeOrders.length}
              </div>
              <Button variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Active Orders */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Orders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOrders.map(order => {
              const elapsedTime = getElapsedTime(order.timeOrdered);
              return (
                <Card 
                  key={order.id} 
                  className={`border-2 ${getStatusColor(order.status, elapsedTime, order.estimatedTime)}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getTypeIcon(order.type)}
                        {order.tokenNumber}
                        {order.tableNumber && (
                          <span className="text-sm text-gray-600">• Table {order.tableNumber}</span>
                        )}
                      </CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{elapsedTime} min ago</span>
                      <span>Est: {order.estimatedTime} min</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{item.quantity}x {item.name}</span>
                            {item.notes && (
                              <p className="text-xs text-orange-600 mt-1">Note: {item.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="flex-1 bg-orange-500 hover:bg-orange-600"
                        >
                          Start Preparing
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="flex-1 bg-blue-500 hover:bg-blue-600"
                        >
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="flex-1 bg-green-500 hover:bg-green-600"
                        >
                          Complete Order
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {activeOrders.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No active orders. Great job!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recently Completed */}
        {completedOrders.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Completed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {completedOrders.slice(0, 4).map(order => (
                <Card key={order.id} className="bg-gray-50 border-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{order.tokenNumber}</span>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      {order.items.length} items • {getElapsedTime(order.timeOrdered)} min ago
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Timer,
  Users,
  Car,
  Store,
  Bell
} from "lucide-react";

interface KitchenOrder {
  id: string;
  tokenNumber: string;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  tableNumber?: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    notes?: string;
    status: 'pending' | 'preparing' | 'ready';
  }>;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  timeOrdered: Date;
  estimatedTime: number;
  priority: 'normal' | 'high' | 'urgent';
}

const KitchenDisplay = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([
    {
      id: '1',
      tokenNumber: 'D-001',
      orderType: 'dine-in',
      tableNumber: 5,
      items: [
        { id: '1', name: 'Margherita Pizza', quantity: 2, status: 'pending' },
        { id: '2', name: 'Caesar Salad', quantity: 1, notes: 'No croutons', status: 'pending' }
      ],
      status: 'pending',
      timeOrdered: new Date(Date.now() - 300000), // 5 mins ago
      estimatedTime: 15,
      priority: 'normal'
    },
    {
      id: '2',
      tokenNumber: 'T-018',
      orderType: 'takeout',
      items: [
        { id: '3', name: 'Chicken Burger', quantity: 1, status: 'preparing' },
        { id: '4', name: 'Coca Cola', quantity: 2, status: 'ready' }
      ],
      status: 'preparing',
      timeOrdered: new Date(Date.now() - 600000), // 10 mins ago
      estimatedTime: 12,
      priority: 'high'
    }
  ]);

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'dine-in' | 'takeout' | 'delivery'>('all');

  const updateItemStatus = (orderId: string, itemId: string, newStatus: 'pending' | 'preparing' | 'ready') => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(item => 
          item.id === itemId ? { ...item, status: newStatus } : item
        );
        
        // Update order status based on items
        let orderStatus: 'pending' | 'preparing' | 'ready' | 'completed' = 'pending';
        if (updatedItems.every(item => item.status === 'ready')) {
          orderStatus = 'ready';
        } else if (updatedItems.some(item => item.status === 'preparing')) {
          orderStatus = 'preparing';
        }
        
        return { ...order, items: updatedItems, status: orderStatus };
      }
      return order;
    }));
    
    toast.success(`Item marked as ${newStatus}`);
  };

  const completeOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'completed' } : order
    ));
    toast.success("Order completed!");
  };

  const getOrderAge = (timeOrdered: Date) => {
    const minutes = Math.floor((Date.now() - timeOrdered.getTime()) / 60000);
    return minutes;
  };

  const getOrderPriorityColor = (priority: string, age: number) => {
    if (age > 20) return 'border-red-500 bg-red-50';
    if (age > 15) return 'border-yellow-500 bg-yellow-50';
    if (priority === 'high') return 'border-orange-500 bg-orange-50';
    return 'border-green-500 bg-green-50';
  };

  const filteredOrders = orders.filter(order => {
    if (selectedFilter === 'all') return order.status !== 'completed';
    return order.orderType === selectedFilter && order.status !== 'completed';
  });

  const orderTypeIcons = {
    'dine-in': Users,
    'takeout': Store,
    'delivery': Car
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="glass-effect border-b-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center animate-fade-in">
              <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                <ChefHat className="h-8 w-8 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Kitchen Display
                </h1>
                <p className="text-xs text-gray-600">Real-time Order Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 animate-fade-in">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Bell className="h-4 w-4" />
                <span>{filteredOrders.length} Active Orders</span>
              </div>
              <div className="text-sm text-gray-600">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Tabs */}
        <Tabs value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as any)} className="mb-6">
          <TabsList className="glass-effect">
            <TabsTrigger value="all">All Orders ({filteredOrders.length})</TabsTrigger>
            <TabsTrigger value="dine-in">Dine-in</TabsTrigger>
            <TabsTrigger value="takeout">Takeout</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const OrderIcon = orderTypeIcons[order.orderType];
            const age = getOrderAge(order.timeOrdered);
            
            return (
              <Card 
                key={order.id} 
                className={`hover-lift animate-scale-in border-2 ${getOrderPriorityColor(order.priority, age)}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                        <OrderIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{order.tokenNumber}</CardTitle>
                        {order.tableNumber && (
                          <p className="text-sm text-gray-600">Table {order.tableNumber}</p>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={order.status === 'ready' ? 'default' : 'secondary'}
                      className={order.status === 'ready' ? 'bg-green-500' : ''}
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{age} min ago</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Timer className="h-4 w-4" />
                      <span>~{order.estimatedTime} min</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/80 backdrop-blur-sm">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{item.quantity}x</span>
                            <span>{item.name}</span>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-orange-600 mt-1">Note: {item.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant={item.status === 'preparing' ? 'default' : 'outline'}
                            onClick={() => updateItemStatus(order.id, item.id, 'preparing')}
                            className="h-8 px-3"
                          >
                            <AlertCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={item.status === 'ready' ? 'default' : 'outline'}
                            onClick={() => updateItemStatus(order.id, item.id, 'ready')}
                            className={`h-8 px-3 ${item.status === 'ready' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.status === 'ready' && (
                    <Button 
                      onClick={() => completeOrder(order.id)}
                      className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete Order
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Active Orders</h3>
            <p className="text-gray-500">New orders will appear here automatically</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;

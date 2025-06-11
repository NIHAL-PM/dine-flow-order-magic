
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
import { useOrderContext } from "@/contexts/OrderContext";

const KitchenDisplay = () => {
  const { savedOrders, updateOrderStatus } = useOrderContext();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'dine-in' | 'takeout' | 'delivery'>('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const updateItemStatus = (orderId: string, newStatus: 'confirmed' | 'preparing' | 'ready') => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Order marked as ${newStatus}`);
  };

  const completeOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'completed');
    toast.success("Order completed!");
  };

  const getOrderAge = (timeOrdered: Date) => {
    const minutes = Math.floor((currentTime.getTime() - timeOrdered.getTime()) / 60000);
    return minutes;
  };

  const getOrderPriorityColor = (priority: string, age: number, status: string) => {
    if (status === 'ready') return 'border-green-500 bg-green-50';
    if (age > 20) return 'border-red-500 bg-red-50';
    if (age > 15) return 'border-yellow-500 bg-yellow-50';
    if (priority === 'high') return 'border-orange-500 bg-orange-50';
    return 'border-blue-500 bg-blue-50';
  };

  // Get orders that are confirmed or in kitchen workflow
  const kitchenOrders = savedOrders.filter(order => 
    ['confirmed', 'preparing', 'ready'].includes(order.status)
  );

  const filteredOrders = kitchenOrders.filter(order => {
    if (selectedFilter === 'all') return true;
    return order.orderType === selectedFilter;
  });

  const orderTypeIcons = {
    'dine-in': Users,
    'takeout': Store,
    'delivery': Car
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-yellow-500';
      case 'ready': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
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
                {currentTime.toLocaleTimeString()}
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
            <TabsTrigger value="dine-in">
              Dine-in ({kitchenOrders.filter(o => o.orderType === 'dine-in').length})
            </TabsTrigger>
            <TabsTrigger value="takeout">
              Takeout ({kitchenOrders.filter(o => o.orderType === 'takeout').length})
            </TabsTrigger>
            <TabsTrigger value="delivery">
              Delivery ({kitchenOrders.filter(o => o.orderType === 'delivery').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Active Orders</h3>
            <p className="text-gray-500">Orders will appear here when confirmed for kitchen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              const OrderIcon = orderTypeIcons[order.orderType];
              const age = getOrderAge(order.timestamp);
              
              return (
                <Card 
                  key={order.id} 
                  className={`hover-lift animate-scale-in border-2 ${getOrderPriorityColor(order.priority, age, order.status)}`}
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
                          {order.waiterName && (
                            <p className="text-xs text-gray-500">Waiter: {order.waiterName}</p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        className={`${getStatusBadgeColor(order.status)} text-white`}
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
                        <span>~{order.estimatedTime || 15} min</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="p-3 rounded-xl bg-white/80 backdrop-blur-sm">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-orange-600">{item.quantity}x</span>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-orange-600 mt-1">Note: {item.notes}</p>
                          )}
                        </div>
                      ))}
                      
                      {order.specialInstructions && (
                        <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                          <p className="text-sm font-medium text-yellow-800">Special Instructions:</p>
                          <p className="text-sm text-yellow-700">{order.specialInstructions}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      {order.status === 'confirmed' && (
                        <Button
                          onClick={() => updateItemStatus(order.id, 'preparing')}
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Start Preparing
                        </Button>
                      )}
                      
                      {order.status === 'preparing' && (
                        <Button
                          onClick={() => updateItemStatus(order.id, 'ready')}
                          className="flex-1 bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark Ready
                        </Button>
                      )}
                      
                      {order.status === 'ready' && (
                        <Button 
                          onClick={() => completeOrder(order.id)}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Order Served
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;

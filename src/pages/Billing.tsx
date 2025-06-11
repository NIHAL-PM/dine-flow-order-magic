
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Receipt,
  Clock,
  CreditCard
} from "lucide-react";
import { useOrderContext, SavedOrder } from "@/contexts/OrderContext";
import BillingDialog from "@/components/BillingDialog";

const Billing = () => {
  const navigate = useNavigate();
  const { savedOrders, deleteOrder } = useOrderContext();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);

  // Get orders that are ready for billing (saved orders or ready orders)
  const billableOrders = savedOrders.filter(order => 
    ['saved', 'ready'].includes(order.status)
  );

  const handleSelectOrder = (order: SavedOrder) => {
    setSelectedOrderId(order.id);
    setBillingDialogOpen(true);
  };

  const handleDeleteOrder = (orderId: string, tokenNumber: string) => {
    deleteOrder(orderId);
    toast.success(`Order ${tokenNumber} cancelled`);
  };

  const getOrderAge = (timestamp: Date) => {
    const minutes = Math.floor((Date.now() - timestamp.getTime()) / 60000);
    return minutes;
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'saved': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Mobile-optimized header */}
      <header className="bg-white/90 backdrop-blur-xl border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="mr-3"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold">Billing & Payments</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Process orders and payments</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs sm:text-sm">
              {billableOrders.length} Orders Ready
            </Badge>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {billableOrders.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Ready for Billing</h3>
            <p className="text-gray-500 mb-4">Orders will appear here when saved or ready to serve</p>
            <Button onClick={() => navigate('/order-taking')} className="bg-blue-500 hover:bg-blue-600">
              Take New Order
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {billableOrders.map(order => {
              const age = getOrderAge(order.timestamp);
              return (
                <Card 
                  key={order.id}
                  className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-300"
                  onClick={() => handleSelectOrder(order)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{order.tokenNumber}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}
                          {order.tableNumber && ` • Table ${order.tableNumber}`}
                        </p>
                        {order.waiterName && (
                          <p className="text-xs text-gray-500">Waiter: {order.waiterName}</p>
                        )}
                        {order.customerName && (
                          <p className="text-xs text-gray-500">Customer: {order.customerName}</p>
                        )}
                      </div>
                      <Badge className={`text-xs ${getOrderStatusColor(order.status)}`}>
                        {order.status === 'saved' ? 'Pending' : 'Ready'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        {order.items.slice(0, 3).map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-gray-500">+{order.items.length - 3} more items</p>
                        )}
                      </div>
                      
                      {order.specialInstructions && (
                        <div className="p-2 bg-yellow-50 rounded text-xs">
                          <p className="text-yellow-800 font-medium">Special Instructions:</p>
                          <p className="text-yellow-700">{order.specialInstructions}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {age} min ago
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600">₹{order.subtotal.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{order.items.length} items</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-green-500 hover:bg-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectOrder(order);
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Process Payment
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrder(order.id, order.tokenNumber);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BillingDialog
        open={billingDialogOpen}
        onOpenChange={setBillingDialogOpen}
        orderId={selectedOrderId}
      />
    </div>
  );
};

export default Billing;


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Receipt,
  Plus,
  Minus,
  CheckCircle,
  Percent,
  Calculator,
  Clock
} from "lucide-react";
import { useOrderContext, SavedOrder } from "@/contexts/OrderContext";

const Billing = () => {
  const navigate = useNavigate();
  const { savedOrders, updateOrderStatus, deleteOrder } = useOrderContext();
  const [selectedOrder, setSelectedOrder] = useState<SavedOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get orders that are ready for billing (saved orders or ready orders)
  const billableOrders = savedOrders.filter(order => 
    ['saved', 'ready'].includes(order.status)
  );

  const calculateTotals = (order: SavedOrder) => {
    const subtotal = order.subtotal;
    const discountAmount = discountType === 'percentage' 
      ? (subtotal * discount) / 100 
      : Math.min(discount, subtotal);
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0.18; // 18% GST
    const total = afterDiscount + tax;
    
    return { subtotal, discountAmount, tax, total };
  };

  const handleCompletePayment = async () => {
    if (!selectedOrder) return;
    
    setIsProcessing(true);
    try {
      // If order is still in 'saved' status, move it to confirmed for kitchen
      if (selectedOrder.status === 'saved') {
        updateOrderStatus(selectedOrder.id, 'confirmed');
        toast.success(`Order ${selectedOrder.tokenNumber} sent to kitchen and payment completed`);
      } else {
        // If order is ready, mark as completed
        updateOrderStatus(selectedOrder.id, 'completed');
        toast.success(`Payment completed for order ${selectedOrder.tokenNumber}`);
      }
      
      setSelectedOrder(null);
      setDiscount(0);
    } catch (error) {
      toast.error("Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
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

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-green-500' },
    { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-500' },
    { id: 'upi', label: 'UPI', icon: Smartphone, color: 'bg-purple-500' }
  ];

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
              <h1 className="text-lg sm:text-xl font-semibold">Billing & Payments</h1>
            </div>
            <Badge variant="outline" className="text-xs sm:text-sm">
              {billableOrders.length} Orders Ready for Billing
            </Badge>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-[calc(100vh-8rem)]">
          {/* Orders List - Mobile optimized */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Receipt className="h-5 w-5" />
                Orders Ready for Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {billableOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium mb-2">No orders ready for billing</p>
                  <p className="text-sm">Orders will appear here when saved or ready to serve</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {billableOrders.map(order => {
                    const age = getOrderAge(order.timestamp);
                    return (
                      <Card 
                        key={order.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedOrder?.id === order.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-sm sm:text-base">
                                {order.tokenNumber}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600">
                                {order.orderType} 
                                {order.tableNumber && ` • Table ${order.tableNumber}`}
                                {order.waiterName && ` • ${order.waiterName}`}
                              </p>
                              {order.customerName && (
                                <p className="text-xs text-gray-500">
                                  Customer: {order.customerName}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-orange-600 text-sm sm:text-base">
                                ₹{order.subtotal}
                              </p>
                              <Badge className={`text-xs ${getOrderStatusColor(order.status)}`}>
                                {order.status === 'saved' ? 'Pending' : 'Ready'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{order.items.length} items</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{age} min ago</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Details - Mobile optimized */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                {selectedOrder ? `Bill - ${selectedOrder.tokenNumber}` : 'Select Order to Bill'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {!selectedOrder ? (
                <div className="text-center py-8 text-gray-500">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium mb-2">Select an order to start billing</p>
                  <p className="text-sm">Choose from the orders list to process payment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Order Details */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Order Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 capitalize">{selectedOrder.orderType}</span>
                      </div>
                      {selectedOrder.tableNumber && (
                        <div>
                          <span className="text-gray-600">Table:</span>
                          <span className="ml-2">{selectedOrder.tableNumber}</span>
                        </div>
                      )}
                      {selectedOrder.waiterName && (
                        <div>
                          <span className="text-gray-600">Waiter:</span>
                          <span className="ml-2">{selectedOrder.waiterName}</span>
                        </div>
                      )}
                      {selectedOrder.customerName && (
                        <div>
                          <span className="text-gray-600">Customer:</span>
                          <span className="ml-2">{selectedOrder.customerName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm sm:text-base">Order Items</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedOrder.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-gray-600">₹{item.price} each</p>
                            {item.notes && (
                              <p className="text-xs text-orange-600">Note: {item.notes}</p>
                            )}
                          </div>
                          <div className="ml-2 text-right">
                            <span className="font-medium text-sm">{item.quantity}x</span>
                            <p className="text-xs text-gray-600">₹{item.price * item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {selectedOrder.specialInstructions && (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold text-sm text-yellow-800 mb-1">Special Instructions</h3>
                      <p className="text-sm text-yellow-700">{selectedOrder.specialInstructions}</p>
                    </div>
                  )}

                  {/* Discount Section */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Discount
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <div className="flex gap-1 mt-1">
                          <Button
                            variant={discountType === 'percentage' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDiscountType('percentage')}
                            className="flex-1 text-xs h-8"
                          >
                            %
                          </Button>
                          <Button
                            variant={discountType === 'fixed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDiscountType('fixed')}
                            className="flex-1 text-xs h-8"
                          >
                            ₹
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Value</Label>
                        <Input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          placeholder="0"
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bill Calculation */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm sm:text-base">Bill Summary</h3>
                    {(() => {
                      const { subtotal, discountAmount, tax, total } = calculateTotals(selectedOrder);
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                          </div>
                          {discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount</span>
                              <span>-₹{discountAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>GST (18%)</span>
                            <span>₹{tax.toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold text-base text-orange-600">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm sm:text-base">Payment Method</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {paymentMethods.map(method => (
                        <Button
                          key={method.id}
                          variant={paymentMethod === method.id ? 'default' : 'outline'}
                          className={`justify-start gap-2 h-10 text-sm ${
                            paymentMethod === method.id ? method.color : ''
                          }`}
                          onClick={() => setPaymentMethod(method.id as any)}
                        >
                          <method.icon className="h-4 w-4" />
                          {method.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedOrder(null)}
                      className="flex-1 text-sm h-10"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCompletePayment}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-sm h-10"
                    >
                      {isProcessing ? 'Processing...' : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete Payment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Billing;

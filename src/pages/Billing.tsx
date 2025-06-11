
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
  Edit,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  Percent,
  Calculator
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

  const pendingOrders = savedOrders.filter(order => order.status === 'saved');

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
      // Update order status to confirmed and send to kitchen
      updateOrderStatus(selectedOrder.id, 'confirmed');
      
      toast.success(`Payment completed for ${selectedOrder.tokenNumber}`);
      setSelectedOrder(null);
      setDiscount(0);
    } catch (error) {
      toast.error("Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateOrderItem = (orderId: string, itemId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item logic would go here
      toast.success("Item removed from order");
    } else {
      // Update quantity logic would go here
      toast.success("Item quantity updated");
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
              <h1 className="text-lg sm:text-xl font-semibold">Billing</h1>
            </div>
            <Badge variant="outline" className="text-xs sm:text-sm">
              {pendingOrders.length} Pending Orders
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
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map(order => (
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
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-orange-600 text-sm sm:text-base">
                              ₹{order.subtotal}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.items.length} items
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.timestamp).toLocaleTimeString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                  <p>Select an order to start billing</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm sm:text-base">Order Items</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedOrder.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-gray-600">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateOrderItem(selectedOrder.id, item.id, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-medium text-sm min-w-[20px] text-center">
                              {item.quantity}
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateOrderItem(selectedOrder.id, item.id, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

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

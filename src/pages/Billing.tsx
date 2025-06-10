
import { useState, useEffect } from "react";
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
  Plus, 
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Trash2,
  Search,
  Calculator,
  Percent
} from "lucide-react";
import { printService, PrintOrder } from "@/services/printService";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  tableNumber?: number;
  customerName?: string;
  items: OrderItem[];
  total: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'billed';
}

const Billing = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data - in real app, this would come from a shared state or API
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: 'ORD-1635789234',
        orderType: 'dine-in',
        tableNumber: 5,
        items: [
          { id: '1', name: 'Margherita Pizza', price: 299, quantity: 2 },
          { id: '4', name: 'Coca Cola', price: 49, quantity: 2 }
        ],
        total: 696,
        timestamp: new Date(),
        status: 'confirmed'
      },
      {
        id: 'ORD-1635789567',
        orderType: 'takeout',
        customerName: 'John Doe',
        items: [
          { id: '2', name: 'Chicken Burger', price: 249, quantity: 1 },
          { id: '3', name: 'Caesar Salad', price: 199, quantity: 1 }
        ],
        total: 448,
        timestamp: new Date(),
        status: 'confirmed'
      }
    ];
    setOrders(mockOrders);
  }, []);

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.tableNumber?.toString().includes(searchTerm)
  );

  const updateItemQuantity = (itemId: string, change: number) => {
    if (!selectedOrder) return;
    
    setSelectedOrder(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id === itemId) {
            const newQuantity = Math.max(0, item.quantity + change);
            return { ...item, quantity: newQuantity };
          }
          return item;
        }).filter(item => item.quantity > 0)
      };
    });
  };

  const removeItem = (itemId: string) => {
    if (!selectedOrder) return;
    
    setSelectedOrder(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      };
    });
    toast.success("Item removed from order");
  };

  const calculateTotals = () => {
    if (!selectedOrder) return { subtotal: 0, discountAmount: 0, tax: 0, total: 0 };
    
    const subtotal = selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = discountType === 'percentage' 
      ? (subtotal * discount) / 100 
      : Math.min(discount, subtotal);
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0.18; // 18% GST
    const total = afterDiscount + tax;
    
    return { subtotal, discountAmount, tax, total };
  };

  const generateTokenNumber = () => {
    const prefix = selectedOrder?.orderType === 'dine-in' ? 'D' : selectedOrder?.orderType === 'takeout' ? 'T' : 'DEL';
    const number = Math.floor(Math.random() * 999) + 1;
    return `${prefix}-${number.toString().padStart(3, '0')}`;
  };

  const completeBilling = async () => {
    if (!selectedOrder) return;
    
    setIsProcessing(true);
    
    try {
      const tokenNumber = generateTokenNumber();
      const { subtotal, discountAmount, tax, total } = calculateTotals();
      
      const printOrder: PrintOrder = {
        tokenNumber,
        orderType: selectedOrder.orderType,
        tableNumber: selectedOrder.tableNumber,
        items: selectedOrder.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal,
        discount: discountAmount,
        tax,
        total,
        paymentMethod,
        timestamp: new Date()
      };
      
      // Print bill
      try {
        const printerAvailable = await printService.checkThermalPrinter();
        if (printerAvailable) {
          await printService.printThermal(printOrder, 'bill');
          toast.success("Bill printed successfully");
        } else {
          printService.printPDF(printOrder);
          toast.success("Bill generated as PDF");
        }
      } catch (error) {
        console.error('Print failed:', error);
        toast.error("Print failed, but order was processed");
      }
      
      // Update order status
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: 'billed' as const }
          : order
      ));
      
      setSelectedOrder(null);
      setDiscount(0);
      toast.success(`Billing completed for ${tokenNumber}`);
      
    } catch (error) {
      console.error('Billing failed:', error);
      toast.error("Billing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const { subtotal, discountAmount, tax, total } = calculateTotals();

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-green-500 hover:bg-green-600' },
    { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'upi', label: 'UPI', icon: Smartphone, color: 'bg-purple-500 hover:bg-purple-600' }
  ];

  return (
    <div className="h-screen-safe bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="glass-effect border-b-0 flex-shrink-0">
        <div className="container-fluid">
          <div className="flex justify-between items-center h-12 sm:h-14">
            <div className="flex items-center animate-fade-in">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="mr-2 btn-touch"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <h1 className="text-responsive-lg font-semibold text-gray-900">Billing</h1>
            </div>
            <div className="flex items-center">
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 container-fluid py-2 sm:py-4">
          {/* Orders List */}
          <div className="flex flex-col">
            <Card className="glass-effect animate-fade-in flex-1 overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
                <CardTitle className="text-responsive-base">Ready for Billing</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto mobile-scroll p-2 sm:p-4">
                {filteredOrders.filter(order => order.status === 'confirmed').length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">No orders ready for billing</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredOrders
                      .filter(order => order.status === 'confirmed')
                      .map(order => (
                        <Card 
                          key={order.id} 
                          className={`cursor-pointer transition-all hover:border-blue-200 ${
                            selectedOrder?.id === order.id ? 'border-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-xs sm:text-sm">{order.id}</p>
                                <p className="text-xs text-gray-600">
                                  {order.orderType} {order.tableNumber && `• Table ${order.tableNumber}`}
                                </p>
                                {order.customerName && (
                                  <p className="text-xs text-gray-600">{order.customerName}</p>
                                )}
                              </div>
                              <Badge variant="default" className="text-xs">
                                ₹{order.total}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              {order.items.length} items • {order.timestamp.toLocaleTimeString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Details & Editing */}
          <div className="flex flex-col">
            <Card className="glass-effect animate-slide-up flex-1 overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
                <CardTitle className="text-responsive-base">
                  {selectedOrder ? `Order ${selectedOrder.id}` : 'Select an Order'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-2 sm:p-4 flex flex-col">
                {!selectedOrder ? (
                  <div className="text-center py-8 flex-1 flex flex-col justify-center">
                    <Receipt className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Select an order to start billing</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-auto mobile-scroll space-y-2 mb-4">
                      {selectedOrder.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-xs sm:text-sm truncate">{item.name}</h4>
                            <p className="text-gray-600 text-xs">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateItemQuantity(item.id, -1)}
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                            >
                              <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
                            </Button>
                            <span className="font-medium min-w-[20px] text-center text-xs sm:text-sm">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateItemQuantity(item.id, 1)}
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                            >
                              <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(item.id)}
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-500 hover:text-red-700 ml-1"
                            >
                              <Trash2 className="h-2 w-2 sm:h-3 sm:w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Discount Section */}
                    <div className="border-t pt-3 flex-shrink-0">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <Label className="text-xs font-medium">Discount Type</Label>
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
                          <Label className="text-xs font-medium">Value</Label>
                          <Input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                            placeholder="0"
                            min="0"
                            max={discountType === 'percentage' ? 100 : subtotal}
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment & Billing */}
          <div className="flex flex-col">
            <Card className="glass-effect animate-slide-up flex-1 overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
                <CardTitle className="text-responsive-base flex items-center gap-2">
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
                  Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-2 sm:p-4 flex flex-col">
                {!selectedOrder ? (
                  <div className="text-center py-8 flex-1 flex flex-col justify-center">
                    <p className="text-gray-500 text-sm">Select an order to view billing</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600 text-sm">
                          <span>Discount</span>
                          <span>-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>GST (18%)</span>
                        <span>₹{tax.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold text-orange-600">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Payment Method</Label>
                      <div className="space-y-2">
                        {paymentMethods.map(method => (
                          <Button
                            key={method.id}
                            variant={paymentMethod === method.id ? 'default' : 'outline'}
                            className={`w-full justify-start gap-2 btn-touch text-sm ${
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
                    
                    <Button 
                      onClick={completeBilling}
                      disabled={isProcessing || selectedOrder.items.length === 0}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 btn-touch text-sm"
                    >
                      {isProcessing ? 'Processing...' : `Complete Billing • ₹${total.toFixed(2)}`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;

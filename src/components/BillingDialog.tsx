
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Receipt,
  Percent,
  Calculator,
  Printer,
  Download,
  FileText,
  CheckCircle
} from "lucide-react";
import { printService, PrintOrder } from "@/services/printService";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  orderType: 'dine-in' | 'takeout' | 'delivery';
  tableNumber?: number | null;
  onOrderComplete: () => void;
}

const BillingDialog = ({ open, onOpenChange, cart, orderType, tableNumber, onOrderComplete }: BillingDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [isProcessing, setIsProcessing] = useState(false);
  const [thermalPrinterAvailable, setThermalPrinterAvailable] = useState(false);

  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discount) / 100 
    : Math.min(discount, subtotal);
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * 0.18; // 18% GST
  const total = afterDiscount + tax;

  useEffect(() => {
    // Check thermal printer availability
    printService.checkThermalPrinter().then(setThermalPrinterAvailable);
  }, []);

  const generateTokenNumber = () => {
    const prefix = orderType === 'dine-in' ? 'D' : orderType === 'takeout' ? 'T' : 'DEL';
    const number = Math.floor(Math.random() * 999) + 1;
    return `${prefix}-${number.toString().padStart(3, '0')}`;
  };

  const createPrintOrder = (tokenNumber: string): PrintOrder => ({
    tokenNumber,
    orderType,
    tableNumber: tableNumber || undefined,
    items: cart.map(item => ({
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
  });

  const handleCompleteOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsProcessing(true);
    
    try {
      const tokenNumber = generateTokenNumber();
      const orderData = createPrintOrder(tokenNumber);
      
      console.log('Order completed:', orderData);
      
      // Print KOT (Kitchen Order Ticket) first
      if (thermalPrinterAvailable) {
        await printService.printThermal(orderData, 'kot');
        toast.success("Kitchen order printed successfully");
      }
      
      // Print customer bill
      if (thermalPrinterAvailable) {
        await printService.printThermal(orderData, 'bill');
        toast.success("Bill printed successfully");
      } else {
        // Fallback to PDF if thermal printer not available
        printService.printPDF(orderData);
        toast.success("Bill generated as PDF");
      }
      
      onOrderComplete();
      onOpenChange(false);
      toast.success(`Order ${tokenNumber} completed successfully!`);
      
    } catch (error) {
      console.error('Order completion failed:', error);
      toast.error("Failed to complete order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = () => {
    const tokenNumber = generateTokenNumber();
    const orderData = createPrintOrder(tokenNumber);
    printService.downloadPDF(orderData);
    toast.success("Bill downloaded as PDF");
  };

  const handlePrintPreview = () => {
    const tokenNumber = generateTokenNumber();
    const orderData = createPrintOrder(tokenNumber);
    printService.printPDF(orderData);
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-green-500 hover:bg-green-600' },
    { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'upi', label: 'UPI', icon: Smartphone, color: 'bg-purple-500 hover:bg-purple-600' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto glass-effect">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            Order Summary & Payment
          </DialogTitle>
          <DialogDescription>
            Review your order details and complete the payment
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Order Details */}
            <Card className="glass-effect hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Order Details</h3>
                  <Badge variant="outline" className="px-3 py-1">
                    {orderType.charAt(0).toUpperCase() + orderType.slice(1)}
                    {tableNumber && ` • Table ${tableNumber}`}
                  </Badge>
                </div>
                
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-600 ml-2">×{item.quantity}</span>
                      </div>
                      <span className="font-medium text-orange-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Discount Section */}
            <Card className="glass-effect hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Percent className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Discount</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Discount Type</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={discountType === 'percentage' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDiscountType('percentage')}
                        className="flex-1"
                      >
                        %
                      </Button>
                      <Button
                        variant={discountType === 'fixed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDiscountType('fixed')}
                        className="flex-1"
                      >
                        ₹
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Discount Value</Label>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      max={discountType === 'percentage' ? 100 : subtotal}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Bill Calculation */}
            <Card className="glass-effect hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Bill Calculation</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discountType === 'percentage' ? `${discount}%` : `₹${discount}`})</span>
                      <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (18%)</span>
                    <span className="font-medium">₹{tax.toFixed(2)}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between text-xl font-bold text-orange-600">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="glass-effect hover-lift">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Payment Method</h3>
                <div className="grid grid-cols-1 gap-3">
                  {paymentMethods.map(method => (
                    <Button
                      key={method.id}
                      variant={paymentMethod === method.id ? 'default' : 'outline'}
                      className={`flex items-center justify-start gap-3 p-4 h-auto transition-all duration-300 ${
                        paymentMethod === method.id ? method.color : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setPaymentMethod(method.id as any)}
                    >
                      <method.icon className="h-5 w-5" />
                      <span className="font-medium">{method.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Print Options */}
        <Card className="glass-effect">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print Options
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPreview}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Print Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              {thermalPrinterAvailable && (
                <Badge className="bg-green-100 text-green-800 px-3 py-1">
                  Thermal Printer Connected
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleCompleteOrder} 
            disabled={isProcessing || cart.length === 0}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 w-full sm:w-auto"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Complete Order • ₹{total.toFixed(2)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BillingDialog;

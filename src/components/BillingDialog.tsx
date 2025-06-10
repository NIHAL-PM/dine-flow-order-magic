
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Receipt,
  Percent,
  Calculator
} from "lucide-react";

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

  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discount) / 100 
    : Math.min(discount, subtotal);
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * 0.18; // 18% GST
  const total = afterDiscount + tax;

  const generateTokenNumber = () => {
    const prefix = orderType === 'dine-in' ? 'D' : orderType === 'takeout' ? 'T' : 'DEL';
    const number = Math.floor(Math.random() * 999) + 1;
    return `${prefix}-${number.toString().padStart(3, '0')}`;
  };

  const handleCompleteOrder = () => {
    const tokenNumber = generateTokenNumber();
    console.log('Order completed:', {
      tokenNumber,
      orderType,
      tableNumber,
      items: cart,
      paymentMethod,
      total,
      timestamp: new Date()
    });
    
    onOrderComplete();
    onOpenChange(false);
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-green-500' },
    { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-500' },
    { id: 'upi', label: 'UPI', icon: Smartphone, color: 'bg-purple-500' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Order Summary & Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Order Details</h3>
                <Badge variant="outline">
                  {orderType.charAt(0).toUpperCase() + orderType.slice(1)}
                  {tableNumber && ` • Table ${tableNumber}`}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-600 ml-2">×{item.quantity}</span>
                    </div>
                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Discount Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Percent className="h-4 w-4" />
                <h3 className="font-semibold">Discount</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant={discountType === 'percentage' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDiscountType('percentage')}
                    >
                      %
                    </Button>
                    <Button
                      variant={discountType === 'fixed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDiscountType('fixed')}
                    >
                      ₹
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    max={discountType === 'percentage' ? 100 : subtotal}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bill Calculation */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-4 w-4" />
                <h3 className="font-semibold">Bill Calculation</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({discountType === 'percentage' ? `${discount}%` : `₹${discount}`})</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Payment Method</h3>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map(method => (
                  <Button
                    key={method.id}
                    variant={paymentMethod === method.id ? 'default' : 'outline'}
                    className={`flex flex-col items-center p-4 h-auto ${
                      paymentMethod === method.id ? method.color : ''
                    }`}
                    onClick={() => setPaymentMethod(method.id as any)}
                  >
                    <method.icon className="h-6 w-6 mb-2" />
                    <span>{method.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCompleteOrder} className="bg-green-600 hover:bg-green-700">
            Complete Order • ₹{total.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BillingDialog;

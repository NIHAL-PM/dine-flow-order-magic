import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Users, 
  Car, 
  Store,
  Send,
  Save,
  Trash2
} from "lucide-react";
import { useOrderContext, OrderItem } from "@/contexts/OrderContext";
import { useMenuContext } from "@/contexts/MenuContext";

const OrderTaking = () => {
  const navigate = useNavigate();
  const { addOrder } = useOrderContext();
  const { categories, items, getItemsByCategory } = useMenuContext();
  
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout' | 'delivery'>('dine-in');
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [waiterName, setWaiterName] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const addItemToOrder = (menuItem: any) => {
    const existingItem = orderItems.find(item => item.id === menuItem.id);
    
    if (existingItem) {
      setOrderItems(prev => 
        prev.map(item => 
          item.id === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newItem: OrderItem = {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1
      };
      setOrderItems(prev => [...prev, newItem]);
    }
    toast.success(`${menuItem.name} added to order`);
  };

  const updateItemQuantity = (itemId: string, change: number) => {
    setOrderItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as OrderItem[];
      
      return updated;
    });
  };

  const removeItemFromOrder = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addItemNote = (itemId: string, note: string) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, notes: note } : item
      )
    );
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const generateTokenNumber = (type: string) => {
    const prefix = type === 'dine-in' ? 'D' : type === 'takeout' ? 'T' : 'DEL';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  };

  const saveOrder = () => {
    if (orderItems.length === 0) {
      toast.error("Please add items to the order");
      return;
    }

    const orderData = {
      tokenNumber: generateTokenNumber(orderType),
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      items: orderItems,
      subtotal: calculateSubtotal(),
      waiterName: waiterName || 'Staff',
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      specialInstructions: specialInstructions || undefined,
      estimatedTime: 15
    };

    addOrder(orderData);
    toast.success(`Order ${orderData.tokenNumber} saved successfully!`);
    
    // Reset form
    setOrderItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setSpecialInstructions('');
    
    // Navigate to billing for immediate processing
    navigate('/billing');
  };

  const sendToKitchen = () => {
    if (orderItems.length === 0) {
      toast.error("Please add items to the order");
      return;
    }

    const orderData = {
      tokenNumber: generateTokenNumber(orderType),
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      items: orderItems,
      subtotal: calculateSubtotal(),
      waiterName: waiterName || 'Staff',
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      specialInstructions: specialInstructions || undefined,
      estimatedTime: 15
    };

    addOrder(orderData);
    
    // Immediately confirm the order to send it to kitchen
    setTimeout(() => {
      // This simulates the order being confirmed and sent to kitchen
      toast.success(`Order ${orderData.tokenNumber} sent to kitchen!`);
    }, 100);
    
    // Reset form
    setOrderItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setSpecialInstructions('');
    
    // Navigate to kitchen display
    navigate('/kitchen');
  };

  const clearOrder = () => {
    setOrderItems([]);
    setSpecialInstructions('');
    toast.info("Order cleared");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
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
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold">Order Taking</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Create new orders</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs sm:text-sm">
              {orderItems.length} Items • ₹{calculateSubtotal()}
            </Badge>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 max-w-7xl mx-auto">
        {/* Menu Section */}
        <div className="lg:col-span-2">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={categories[0]?.id} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {categories.filter(cat => cat.active).slice(0, 3).map(category => (
                    <TabsTrigger key={category.id} value={category.id}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {categories.filter(cat => cat.active).map(category => (
                  <TabsContent key={category.id} value={category.id} className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {getItemsByCategory(category.id).filter(item => item.available).map(item => (
                        <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => addItemToOrder(item)}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">{item.name}</h3>
                              <span className="text-orange-600 font-bold">₹{item.price}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                            {item.dietary && item.dietary.length > 0 && (
                              <div className="flex gap-1 mb-3">
                                {item.dietary.map(diet => (
                                  <Badge key={diet} variant="outline" className="text-xs">
                                    {diet}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <Button size="sm" className="w-full">
                              <Plus className="h-4 w-4 mr-2" />
                              Add to Order
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Section */}
        <div className="space-y-6">
          {/* Order Type Selection */}
          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Order Type</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { value: 'dine-in', icon: Users, label: 'Dine-in' },
                    { value: 'takeout', icon: Store, label: 'Takeout' },
                    { value: 'delivery', icon: Car, label: 'Delivery' }
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={orderType === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setOrderType(value as any)}
                      className="flex flex-col h-auto py-3"
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {orderType === 'dine-in' && (
                <div>
                  <Label>Table Number</Label>
                  <Input
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(Number(e.target.value))}
                    min="1"
                    max="50"
                    className="mt-2"
                  />
                </div>
              )}

              <div>
                <Label>Waiter Name</Label>
                <Input
                  value={waiterName}
                  onChange={(e) => setWaiterName(e.target.value)}
                  placeholder="Enter waiter name"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Customer Name (Optional)</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="mt-2"
                />
              </div>

              {(orderType === 'takeout' || orderType === 'delivery') && (
                <div>
                  <Label>Customer Phone</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Order */}
          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Current Order</CardTitle>
                {orderItems.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearOrder}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No items added</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {orderItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">₹{item.price} each</p>
                        {item.notes && (
                          <p className="text-xs text-orange-600">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(item.id, -1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(item.id, 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemFromOrder(item.id)}
                          className="h-8 w-8 p-0 text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {orderItems.length > 0 && (
                <>
                  <div className="mt-4">
                    <Label>Special Instructions</Label>
                    <Textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special requests..."
                      className="mt-2"
                      rows={2}
                    />
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-orange-600">₹{calculateSubtotal()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={saveOrder}
                      variant="outline"
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Order
                    </Button>
                    <Button
                      onClick={sendToKitchen}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send to Kitchen
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderTaking;

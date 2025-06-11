
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Plus, 
  Minus,
  ShoppingCart,
  Users,
  Car,
  Store,
  Trash2,
  Save,
  Send
} from "lucide-react";
import { useOrderContext, OrderItem } from "@/contexts/OrderContext";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
}

const OrderTaking = () => {
  const navigate = useNavigate();
  const { addOrder } = useOrderContext();
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout' | 'delivery'>('dine-in');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [waiterName, setWaiterName] = useState('');

  // Production menu items
  const baseMenuItems: MenuItem[] = [
    // Main Course
    { id: '1', name: 'Paneer Butter Masala', price: 285, category: 'Main Course', description: 'Creamy tomato curry with cottage cheese', available: true },
    { id: '2', name: 'Chicken Biryani', price: 345, category: 'Main Course', description: 'Aromatic basmati rice with spiced chicken', available: true },
    { id: '3', name: 'Dal Tadka', price: 195, category: 'Main Course', description: 'Yellow lentils tempered with spices', available: true },
    { id: '4', name: 'Butter Chicken', price: 325, category: 'Main Course', description: 'Tender chicken in rich tomato gravy', available: true },
    { id: '5', name: 'Vegetable Pulao', price: 225, category: 'Main Course', description: 'Fragrant rice with mixed vegetables', available: true },
    { id: '6', name: 'Fish Curry', price: 365, category: 'Main Course', description: 'Fresh fish in coconut curry', available: true },
    
    // Appetizers
    { id: '7', name: 'Chicken Tikka', price: 295, category: 'Appetizers', description: 'Grilled chicken marinated in yogurt and spices', available: true },
    { id: '8', name: 'Paneer Tikka', price: 245, category: 'Appetizers', description: 'Grilled cottage cheese with bell peppers', available: true },
    { id: '9', name: 'Samosa (2 pcs)', price: 65, category: 'Appetizers', description: 'Crispy pastry filled with spiced potatoes', available: true },
    { id: '10', name: 'Spring Rolls (4 pcs)', price: 125, category: 'Appetizers', description: 'Crispy rolls with vegetable filling', available: true },
    { id: '11', name: 'Fish Fry', price: 275, category: 'Appetizers', description: 'Crispy fried fish with spices', available: true },
    
    // Beverages
    { id: '12', name: 'Masala Chai', price: 35, category: 'Beverages', description: 'Traditional Indian spiced tea', available: true },
    { id: '13', name: 'Fresh Lime Soda', price: 55, category: 'Beverages', description: 'Refreshing lime with soda water', available: true },
    { id: '14', name: 'Mango Lassi', price: 75, category: 'Beverages', description: 'Creamy yogurt drink with mango', available: true },
    { id: '15', name: 'Coffee', price: 45, category: 'Beverages', description: 'Freshly brewed coffee', available: true },
    { id: '16', name: 'Coconut Water', price: 65, category: 'Beverages', description: 'Fresh tender coconut water', available: true },
    
    // Desserts
    { id: '17', name: 'Gulab Jamun (2 pcs)', price: 85, category: 'Desserts', description: 'Sweet milk dumplings in sugar syrup', available: true },
    { id: '18', name: 'Ice Cream (1 scoop)', price: 65, category: 'Desserts', description: 'Choose from vanilla, chocolate, or strawberry', available: true },
    { id: '19', name: 'Kheer', price: 95, category: 'Desserts', description: 'Rice pudding with cardamom and nuts', available: true },
    { id: '20', name: 'Gajar Halwa', price: 105, category: 'Desserts', description: 'Carrot pudding with milk and ghee', available: true }
  ];

  const categories = [...new Set(baseMenuItems.map(item => item.category))];

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        toast.success(`Added another ${item.name}`);
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      toast.success(`${item.name} added to cart`);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(prev => 
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + change;
          if (newQuantity <= 0) {
            toast.success("Item removed from cart");
          }
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.success("Item removed from cart");
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setSpecialInstructions('');
    setSelectedTable(null);
    toast.success("Cart cleared");
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const generateTokenNumber = () => {
    const prefix = orderType === 'dine-in' ? 'D' : orderType === 'takeout' ? 'T' : 'DEL';
    const timestamp = Date.now();
    const number = (timestamp % 1000).toString().padStart(3, '0');
    return `${prefix}-${number}`;
  };

  const validateOrder = (): string | null => {
    if (cart.length === 0) return "Cart is empty";
    if (orderType === 'dine-in' && !selectedTable) return "Please select a table";
    if (!waiterName.trim()) return "Please enter waiter name";
    if ((orderType === 'takeout' || orderType === 'delivery') && !customerName.trim()) {
      return "Please enter customer name";
    }
    if (orderType === 'delivery' && !customerPhone.trim()) {
      return "Please enter customer phone number";
    }
    return null;
  };

  const handleSaveOrder = () => {
    const validationError = validateOrder();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const tokenNumber = generateTokenNumber();
    
    addOrder({
      tokenNumber,
      orderType,
      tableNumber: selectedTable,
      items: cart,
      subtotal: getTotalAmount(),
      waiterName: waiterName.trim(),
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined
    });

    toast.success(`Order ${tokenNumber} saved successfully!`);
    clearCart();
    setWaiterName('');
  };

  const handleSaveAndSendToKitchen = () => {
    const validationError = validateOrder();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const tokenNumber = generateTokenNumber();
    
    addOrder({
      tokenNumber,
      orderType,
      tableNumber: selectedTable,
      items: cart,
      subtotal: getTotalAmount(),
      waiterName: waiterName.trim(),
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined
    });

    // Get the order ID and immediately send to kitchen
    setTimeout(() => {
      toast.success(`Order ${tokenNumber} saved and sent to kitchen!`);
    }, 100);

    clearCart();
    setWaiterName('');
  };

  const orderTypeButtons = [
    { type: 'dine-in' as const, label: 'Dine-in', icon: Users, color: 'bg-blue-500 hover:bg-blue-600' },
    { type: 'takeout' as const, label: 'Takeout', icon: Store, color: 'bg-green-500 hover:bg-green-600' },
    { type: 'delivery' as const, label: 'Delivery', icon: Car, color: 'bg-orange-500 hover:bg-orange-600' }
  ];

  const availableItems = baseMenuItems.filter(item => item.available);

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
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold">Take Order</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Create new orders</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {orderTypeButtons.map(({ type, label, icon: Icon, color }) => (
                <Button
                  key={type}
                  variant={orderType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType(type)}
                  className={`text-xs sm:text-sm h-8 px-2 sm:px-3 ${orderType === type ? color : ""}`}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-8rem)]">
          {/* Menu Section - Mobile optimized */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <ShoppingCart className="h-5 w-5" />
                  Menu ({availableItems.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <Tabs defaultValue={categories[0]} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-4 mb-4 h-9">
                    {categories.map(category => (
                      <TabsTrigger key={category} value={category} className="text-xs">
                        {category.split(' ')[0]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {categories.map(category => (
                    <TabsContent key={category} value={category} className="flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableItems
                          .filter(item => item.category === category)
                          .map(item => (
                            <Card key={item.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{item.description}</p>
                                  </div>
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    ₹{item.price}
                                  </Badge>
                                </div>
                                <Button 
                                  onClick={() => addToCart(item)}
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-xs sm:text-sm h-8"
                                  disabled={!item.available}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
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

          {/* Cart Section - Mobile optimized */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Order Cart
                  </div>
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {cart.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm">Cart is empty</p>
                      <p className="text-gray-400 text-xs mt-1">Add items from the menu</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.name}</h4>
                            <p className="text-gray-600 text-xs">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-medium text-sm min-w-[20px] text-center">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-7 w-7 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="h-7 w-7 p-0 text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Details Form */}
                    <div className="space-y-3 border-t pt-4">
                      <div>
                        <Label className="text-xs font-medium">Waiter Name *</Label>
                        <Input
                          value={waiterName}
                          onChange={(e) => setWaiterName(e.target.value)}
                          placeholder="Enter waiter name"
                          className="mt-1 h-8 text-sm"
                        />
                      </div>

                      {orderType === 'dine-in' && (
                        <div>
                          <Label className="text-xs font-medium">Select Table *</Label>
                          <div className="grid grid-cols-4 gap-1 mt-1">
                            {Array.from({length: 12}, (_, i) => i + 1).map(table => (
                              <Button
                                key={table}
                                variant={selectedTable === table ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedTable(table)}
                                className="h-8 text-xs"
                              >
                                {table}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(orderType === 'takeout' || orderType === 'delivery') && (
                        <>
                          <div>
                            <Label className="text-xs font-medium">
                              Customer Name {orderType === 'delivery' ? '*' : ''}
                            </Label>
                            <Input
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Enter customer name"
                              className="mt-1 h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium">
                              Phone Number {orderType === 'delivery' ? '*' : ''}
                            </Label>
                            <Input
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder="Enter phone number"
                              className="mt-1 h-8 text-sm"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <Label className="text-xs font-medium">Special Instructions</Label>
                        <Textarea
                          value={specialInstructions}
                          onChange={(e) => setSpecialInstructions(e.target.value)}
                          placeholder="Any special requests..."
                          className="mt-1 h-16 text-sm resize-none"
                        />
                      </div>

                      <div className="flex justify-between items-center py-2 border-t">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold text-lg text-orange-600">₹{getTotalAmount()}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10"
                          onClick={handleSaveOrder}
                          disabled={cart.length === 0}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Order
                        </Button>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-10"
                          onClick={handleSaveAndSendToKitchen}
                          disabled={cart.length === 0}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Save & Send to Kitchen
                        </Button>
                      </div>
                    </div>
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

export default OrderTaking;

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
  User,
  Phone
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

  const menuItems: MenuItem[] = [
    {
      id: '1',
      name: 'Margherita Pizza',
      price: 299,
      category: 'Main Course',
      description: 'Fresh tomatoes, mozzarella, basil',
      available: true
    },
    {
      id: '2',
      name: 'Chicken Burger',
      price: 249,
      category: 'Main Course',
      description: 'Grilled chicken, lettuce, tomato',
      available: true
    },
    {
      id: '3',
      name: 'Caesar Salad',
      price: 199,
      category: 'Appetizers',
      description: 'Romaine lettuce, parmesan, croutons',
      available: true
    },
    {
      id: '4',
      name: 'Coca Cola',
      price: 49,
      category: 'Beverages',
      description: 'Chilled soft drink',
      available: true
    },
    {
      id: '5',
      name: 'Chocolate Cake',
      price: 149,
      category: 'Desserts',
      description: 'Rich chocolate cake with frosting',
      available: true
    },
    {
      id: '6',
      name: 'Chicken Tikka',
      price: 329,
      category: 'Appetizers',
      description: 'Grilled chicken with spices',
      available: true
    },
    {
      id: '7',
      name: 'Masala Chai',
      price: 25,
      category: 'Beverages',
      description: 'Traditional Indian spiced tea',
      available: true
    },
    {
      id: '8',
      name: 'Biryani',
      price: 349,
      category: 'Main Course',
      description: 'Aromatic rice with chicken',
      available: true
    }
  ];

  const categories = [...new Set(menuItems.map(item => item.category))];

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
    const number = Math.floor(Math.random() * 999) + 1;
    return `${prefix}-${number.toString().padStart(3, '0')}`;
  };

  const handleSaveOrder = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (orderType === 'dine-in' && !selectedTable) {
      toast.error("Please select a table");
      return;
    }

    if (!waiterName.trim()) {
      toast.error("Please enter waiter name");
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

  const orderTypeButtons = [
    { type: 'dine-in' as const, label: 'Dine-in', icon: Users, color: 'bg-blue-500 hover:bg-blue-600' },
    { type: 'takeout' as const, label: 'Takeout', icon: Store, color: 'bg-green-500 hover:bg-green-600' },
    { type: 'delivery' as const, label: 'Delivery', icon: Car, color: 'bg-orange-500 hover:bg-orange-600' }
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
              <h1 className="text-lg sm:text-xl font-semibold">Take Order</h1>
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
                  Menu
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
                        {menuItems
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
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(table => (
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
                            <Label className="text-xs font-medium">Customer Name</Label>
                            <Input
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Enter customer name"
                              className="mt-1 h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium">Phone Number</Label>
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
                      
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-10"
                        onClick={handleSaveOrder}
                        disabled={cart.length === 0 || (orderType === 'dine-in' && !selectedTable) || !waiterName.trim()}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Order
                      </Button>
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

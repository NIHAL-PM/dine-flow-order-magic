
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Receipt
} from "lucide-react";
import BillingDialog from "@/components/BillingDialog";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
  image?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

const OrderTaking = () => {
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout' | 'delivery'>('dine-in');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showBilling, setShowBilling] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: '1',
      name: 'Margherita Pizza',
      price: 299,
      category: 'Main Course',
      description: 'Fresh tomatoes, mozzarella, basil',
      available: true,
      image: '/placeholder.svg'
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
    toast.success("Cart cleared");
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleOrderComplete = () => {
    clearCart();
    setSelectedTable(null);
    toast.success("Order completed successfully!");
  };

  const orderTypeButtons = [
    { type: 'dine-in' as const, label: 'Dine-in', icon: Users, color: 'bg-blue-500 hover:bg-blue-600' },
    { type: 'takeout' as const, label: 'Takeout', icon: Store, color: 'bg-green-500 hover:bg-green-600' },
    { type: 'delivery' as const, label: 'Delivery', icon: Car, color: 'bg-orange-500 hover:bg-orange-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="glass-effect border-b-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center animate-fade-in">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="mr-4 hover-lift"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Order Taking</h1>
            </div>
            <div className="flex items-center space-x-2 animate-fade-in">
              {orderTypeButtons.map(({ type, label, icon: Icon, color }) => (
                <Button
                  key={type}
                  variant={orderType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType(type)}
                  className={`hover-lift ${orderType === type ? color : ""}`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Menu Section */}
          <div className="lg:col-span-2">
            <Card className="glass-effect animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  Menu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={categories[0]} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    {categories.map(category => (
                      <TabsTrigger key={category} value={category} className="text-xs font-medium">
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {categories.map(category => (
                    <TabsContent key={category} value={category} className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {menuItems
                          .filter(item => item.category === category)
                          .map(item => (
                            <Card key={item.id} className="hover-lift hover-glow transition-all duration-300 border-2 hover:border-orange-200">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                                    <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                                  </div>
                                  <Badge variant={item.available ? "default" : "secondary"} className="ml-3">
                                    ₹{item.price}
                                  </Badge>
                                </div>
                                <Button 
                                  onClick={() => addToCart(item)}
                                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all duration-300"
                                  disabled={!item.available}
                                >
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

          {/* Enhanced Cart Section */}
          <div className="lg:col-span-1">
            <Card className="glass-effect sticky top-24 animate-slide-in-right">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                    Current Order
                  </div>
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No items in cart</p>
                    <p className="text-sm text-gray-400 mt-1">Add items from the menu</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-xl animate-scale-in">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.name}</h4>
                            <p className="text-gray-600 text-xs">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center space-x-2 ml-3">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-medium min-w-[24px] text-center">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-lg">Total:</span>
                        <span className="font-bold text-xl text-orange-600">₹{getTotalAmount()}</span>
                      </div>
                      
                      {orderType === 'dine-in' && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Select Table:</label>
                          <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(table => (
                              <Button
                                key={table}
                                variant={selectedTable === table ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedTable(table)}
                                className={selectedTable === table ? "bg-blue-500 hover:bg-blue-600" : ""}
                              >
                                {table}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 animate-bounce-in"
                        onClick={() => setShowBilling(true)}
                        disabled={cart.length === 0 || (orderType === 'dine-in' && !selectedTable)}
                      >
                        <Receipt className="h-5 w-5 mr-2" />
                        Proceed to Billing
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BillingDialog
        open={showBilling}
        onOpenChange={setShowBilling}
        cart={cart}
        orderType={orderType}
        tableNumber={selectedTable}
        onOrderComplete={handleOrderComplete}
      />
    </div>
  );
};

export default OrderTaking;

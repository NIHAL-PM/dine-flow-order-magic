import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Search
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

interface SavedOrder {
  id: string;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  tableNumber?: number;
  customerName?: string;
  items: CartItem[];
  total: number;
  timestamp: Date;
  status: 'pending' | 'confirmed';
}

const OrderTaking = () => {
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout' | 'delivery'>('dine-in');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);

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

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    setSelectedTable(null);
    setCustomerName("");
    toast.success("Cart cleared");
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const saveOrder = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (orderType === 'dine-in' && !selectedTable) {
      toast.error("Please select a table");
      return;
    }

    const newOrder: SavedOrder = {
      id: `ORD-${Date.now()}`,
      orderType,
      tableNumber: selectedTable || undefined,
      customerName: customerName || undefined,
      items: [...cart],
      total: getTotalAmount(),
      timestamp: new Date(),
      status: 'pending'
    };

    setSavedOrders(prev => [...prev, newOrder]);
    clearCart();
    toast.success(`Order ${newOrder.id} saved! Send to billing when ready.`);
  };

  const sendToBilling = (orderId: string) => {
    setSavedOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'confirmed' as const }
          : order
      )
    );
    toast.success("Order sent to billing!");
  };

  const deleteOrder = (orderId: string) => {
    setSavedOrders(prev => prev.filter(order => order.id !== orderId));
    toast.success("Order deleted");
  };

  const orderTypeButtons = [
    { type: 'dine-in' as const, label: 'Dine-in', icon: Users, color: 'bg-blue-500 hover:bg-blue-600' },
    { type: 'takeout' as const, label: 'Takeout', icon: Store, color: 'bg-green-500 hover:bg-green-600' },
    { type: 'delivery' as const, label: 'Delivery', icon: Car, color: 'bg-orange-500 hover:bg-orange-600' }
  ];

  return (
    <div className="h-screen-safe bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden flex flex-col">
      {/* Responsive Header */}
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
              <h1 className="text-responsive-lg font-semibold text-gray-900">Order Taking</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 animate-fade-in">
              {orderTypeButtons.map(({ type, label, icon: Icon, color }) => (
                <Button
                  key={type}
                  variant={orderType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType(type)}
                  className={`btn-touch text-xs sm:text-sm ${orderType === type ? color : ""}`}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.charAt(0)}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-4 container-fluid py-2 sm:py-4">
          {/* Menu Section */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="glass-effect animate-fade-in flex-1 overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-responsive-base">Menu</CardTitle>
                  <div className="flex-1 max-w-xs ml-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-2 sm:p-4">
                <Tabs defaultValue={categories[0]} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-4 mb-2 sm:mb-4 flex-shrink-0">
                    {categories.map(category => (
                      <TabsTrigger key={category} value={category} className="text-xs font-medium">
                        {category.split(' ')[0]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {categories.map(category => (
                    <TabsContent key={category} value={category} className="flex-1 overflow-auto mobile-scroll">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {(searchTerm ? filteredItems : menuItems)
                          .filter(item => item.category === category)
                          .map(item => (
                            <Card key={item.id} className="hover-lift hover-glow transition-all duration-200 border hover:border-orange-200">
                              <CardContent className="p-2 sm:p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                                    <p className="text-gray-600 text-xs sm:text-sm mb-1 line-clamp-2">{item.description}</p>
                                  </div>
                                  <Badge variant="default" className="ml-2 text-xs">
                                    ₹{item.price}
                                  </Badge>
                                </div>
                                <Button 
                                  onClick={() => addToCart(item)}
                                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 btn-touch text-xs sm:text-sm"
                                  disabled={!item.available}
                                >
                                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Add
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

          {/* Current Order Section */}
          <div className="flex flex-col">
            <Card className="glass-effect animate-slide-up flex-1 overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
                <CardTitle className="flex items-center justify-between text-responsive-base">
                  <span>Current Order</span>
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart} className="btn-touch">
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-2 sm:p-4 flex flex-col">
                {cart.length === 0 ? (
                  <div className="text-center py-8 flex-1 flex flex-col justify-center">
                    <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">No items in cart</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-auto mobile-scroll space-y-2 mb-4">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg animate-scale-in">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-xs sm:text-sm truncate">{item.name}</h4>
                            <p className="text-gray-600 text-xs">₹{item.price}</p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                            >
                              <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
                            </Button>
                            <span className="font-medium min-w-[20px] text-center text-xs sm:text-sm">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                            >
                              <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-3 flex-shrink-0">
                      {orderType === 'dine-in' && (
                        <div className="mb-3">
                          <Label className="text-xs sm:text-sm font-medium">Table:</Label>
                          <div className="grid grid-cols-4 gap-1 mt-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(table => (
                              <Button
                                key={table}
                                variant={selectedTable === table ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedTable(table)}
                                className={`btn-touch text-xs ${selectedTable === table ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                              >
                                {table}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(orderType === 'takeout' || orderType === 'delivery') && (
                        <div className="mb-3">
                          <Label className="text-xs sm:text-sm font-medium">Customer Name:</Label>
                          <Input
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Enter customer name"
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-sm sm:text-base">Total:</span>
                        <span className="font-bold text-lg sm:text-xl text-orange-600">₹{getTotalAmount()}</span>
                      </div>
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 btn-touch text-xs sm:text-sm"
                        onClick={saveOrder}
                        disabled={cart.length === 0 || (orderType === 'dine-in' && !selectedTable)}
                      >
                        <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Save Order
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Saved Orders Section */}
          <div className="flex flex-col">
            <Card className="glass-effect animate-slide-up flex-1 overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
                <CardTitle className="text-responsive-base">Saved Orders ({savedOrders.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto mobile-scroll p-2 sm:p-4">
                {savedOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No saved orders</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedOrders.map(order => (
                      <Card key={order.id} className="border hover:border-blue-200 transition-colors">
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
                            <Badge variant={order.status === 'pending' ? 'secondary' : 'default'} className="text-xs">
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-orange-600 text-sm">₹{order.total}</span>
                            <div className="flex space-x-1">
                              {order.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => sendToBilling(order.id)}
                                  className="bg-blue-500 hover:bg-blue-600 text-xs h-6 px-2"
                                >
                                  Bill
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteOrder(order.id)}
                                className="text-red-500 hover:text-red-700 text-xs h-6 px-2"
                              >
                                Del
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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

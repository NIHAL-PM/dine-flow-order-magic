
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
import { useRestaurant, OrderItem, Order } from "@/contexts/RestaurantContext";
import OrderStatusBadge from "@/components/OrderStatusBadge";
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
  Search,
  Clock,
  Leaf,
  Flame
} from "lucide-react";

const OrderTaking = () => {
  const navigate = useNavigate();
  const { menuItems, orders, addOrder, tables } = useRestaurant();
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout' | 'delivery'>('dine-in');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [waiterName, setWaiterName] = useState("");

  const categories = [...new Set(menuItems.map(item => item.category))];
  const availableTables = tables.filter(table => table.status === 'available');
  
  const filteredItems = menuItems.filter(item =>
    item.available && (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const addToCart = (item: typeof menuItems[0]) => {
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

  const addItemNotes = (id: string, notes: string) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, notes } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedTable(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setSpecialInstructions("");
    toast.success("Cart cleared");
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateEstimatedTime = () => {
    return Math.max(...cart.map(item => item.preparationTime));
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

    if ((orderType === 'takeout' || orderType === 'delivery') && !customerName) {
      toast.error("Please enter customer name");
      return;
    }

    if (orderType === 'delivery' && !customerAddress) {
      toast.error("Please enter delivery address");
      return;
    }

    const subtotal = getTotalAmount();
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const orderData: Omit<Order, 'id' | 'tokenNumber' | 'timestamp'> = {
      orderType,
      tableNumber: selectedTable || undefined,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      customerAddress: customerAddress || undefined,
      items: [...cart],
      subtotal,
      discount: 0,
      discountType: 'percentage',
      tax,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      estimatedTime: calculateEstimatedTime(),
      waiterName: waiterName || undefined,
      specialInstructions: specialInstructions || undefined
    };

    addOrder(orderData);
    clearCart();
    toast.success("Order saved! Ready for confirmation and billing.");
  };

  const recentOrders = orders
    .filter(order => order.waiterName === waiterName || !waiterName)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const orderTypeButtons = [
    { type: 'dine-in' as const, label: 'Dine-in', icon: Users, color: 'bg-blue-500 hover:bg-blue-600' },
    { type: 'takeout' as const, label: 'Takeout', icon: Store, color: 'bg-green-500 hover:bg-green-600' },
    { type: 'delivery' as const, label: 'Delivery', icon: Car, color: 'bg-orange-500 hover:bg-orange-600' }
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
                                    <div className="flex items-center gap-1 mb-1">
                                      <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                                      {item.isVegetarian && <Leaf className="h-3 w-3 text-green-500" />}
                                      {item.spiceLevel !== 'mild' && <Flame className="h-3 w-3 text-red-500" />}
                                    </div>
                                    <p className="text-gray-600 text-xs sm:text-sm mb-1 line-clamp-2">{item.description}</p>
                                    <div className="flex items-center gap-1 mb-1">
                                      <Clock className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">{item.preparationTime} min</span>
                                    </div>
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
                                  Add to Cart
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
                        <div key={item.id} className="bg-gray-50 p-2 rounded-lg animate-scale-in">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-xs sm:text-sm truncate">{item.name}</h4>
                              <p className="text-gray-600 text-xs">₹{item.price} × {item.quantity}</p>
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
                          <Input
                            placeholder="Special notes..."
                            value={item.notes || ''}
                            onChange={(e) => addItemNotes(item.id, e.target.value)}
                            className="h-6 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-3 flex-shrink-0 space-y-3">
                      {/* Waiter Name */}
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">Waiter Name:</Label>
                        <Input
                          value={waiterName}
                          onChange={(e) => setWaiterName(e.target.value)}
                          placeholder="Enter your name"
                          className="mt-1 h-8 text-sm"
                        />
                      </div>

                      {/* Order Type Specific Fields */}
                      {orderType === 'dine-in' && (
                        <div>
                          <Label className="text-xs sm:text-sm font-medium">Table ({availableTables.length} available):</Label>
                          <div className="grid grid-cols-4 gap-1 mt-1">
                            {availableTables.slice(0, 8).map(table => (
                              <Button
                                key={table.id}
                                variant={selectedTable === table.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedTable(table.id)}
                                className={`btn-touch text-xs ${selectedTable === table.id ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                              >
                                T{table.id}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(orderType === 'takeout' || orderType === 'delivery') && (
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs sm:text-sm font-medium">Customer Name:</Label>
                            <Input
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Enter customer name"
                              className="mt-1 h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs sm:text-sm font-medium">Phone:</Label>
                            <Input
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder="Enter phone number"
                              className="mt-1 h-8 text-sm"
                            />
                          </div>
                          {orderType === 'delivery' && (
                            <div>
                              <Label className="text-xs sm:text-sm font-medium">Address:</Label>
                              <Textarea
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                placeholder="Enter delivery address"
                                className="mt-1 h-16 text-sm resize-none"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Special Instructions */}
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">Special Instructions:</Label>
                        <Textarea
                          value={specialInstructions}
                          onChange={(e) => setSpecialInstructions(e.target.value)}
                          placeholder="Any special requests..."
                          className="mt-1 h-12 text-sm resize-none"
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-sm sm:text-base">Total: ₹{getTotalAmount()}</span>
                          <p className="text-xs text-gray-500">Est. {calculateEstimatedTime()} min</p>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 btn-touch text-xs sm:text-sm"
                        onClick={saveOrder}
                        disabled={
                          cart.length === 0 || 
                          (orderType === 'dine-in' && !selectedTable) ||
                          ((orderType === 'takeout' || orderType === 'delivery') && !customerName) ||
                          (orderType === 'delivery' && !customerAddress)
                        }
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

          {/* Recent Orders Section */}
          <div className="flex flex-col">
            <Card className="glass-effect animate-slide-up flex-1 overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
                <CardTitle className="text-responsive-base">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto mobile-scroll p-2 sm:p-4">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No recent orders</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentOrders.map(order => (
                      <Card key={order.id} className="border hover:border-blue-200 transition-colors">
                        <CardContent className="p-2 sm:p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-xs sm:text-sm">{order.tokenNumber}</p>
                              <p className="text-xs text-gray-600">
                                {order.orderType} {order.tableNumber && `• Table ${order.tableNumber}`}
                              </p>
                              {order.customerName && (
                                <p className="text-xs text-gray-600">{order.customerName}</p>
                              )}
                            </div>
                            <OrderStatusBadge status={order.status} variant="compact" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-orange-600 text-sm">₹{order.total}</span>
                            <span className="text-xs text-gray-500">
                              {order.timestamp.toLocaleTimeString()}
                            </span>
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


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Plus, 
  Minus,
  ShoppingCart,
  Users,
  Car,
  Store
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
}

const OrderTaking = () => {
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout' | 'delivery'>('dine-in');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

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
    }
  ];

  const categories = [...new Set(menuItems.map(item => item.category))];

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(prev => 
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const orderTypeButtons = [
    { type: 'dine-in' as const, label: 'Dine-in', icon: Users, color: 'bg-blue-500' },
    { type: 'takeout' as const, label: 'Takeout', icon: Store, color: 'bg-green-500' },
    { type: 'delivery' as const, label: 'Delivery', icon: Car, color: 'bg-orange-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Order Taking</h1>
            </div>
            <div className="flex items-center space-x-2">
              {orderTypeButtons.map(({ type, label, icon: Icon, color }) => (
                <Button
                  key={type}
                  variant={orderType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType(type)}
                  className={orderType === type ? color : ""}
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
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Menu</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={categories[0]} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    {categories.map(category => (
                      <TabsTrigger key={category} value={category} className="text-xs">
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
                            <Card key={item.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold text-lg">{item.name}</h3>
                                  <Badge variant={item.available ? "default" : "secondary"}>
                                    ₹{item.price}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                                <Button 
                                  onClick={() => addToCart(item)}
                                  className="w-full"
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

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Current Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No items in cart</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-gray-600 text-xs">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-medium min-w-[20px] text-center">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold text-lg">₹{getTotalAmount()}</span>
                      </div>
                      
                      {orderType === 'dine-in' && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Table Number:</label>
                          <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(table => (
                              <Button
                                key={table}
                                variant={selectedTable === table ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedTable(table)}
                              >
                                {table}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        Place Order
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

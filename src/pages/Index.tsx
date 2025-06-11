
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChefHat, 
  Users, 
  ShoppingCart, 
  Calendar,
  BarChart3,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  Receipt
} from "lucide-react";
import { useOrderContext } from "@/contexts/OrderContext";

const Index = () => {
  const navigate = useNavigate();
  const { savedOrders, getOrdersByStatus } = useOrderContext();

  // Calculate real statistics
  const todaysOrders = savedOrders.filter(order => {
    const today = new Date();
    const orderDate = new Date(order.timestamp);
    return orderDate.toDateString() === today.toDateString();
  });

  const activeOrders = savedOrders.filter(order => order.status !== 'completed');
  const kitchenQueue = savedOrders.filter(order => 
    ['confirmed', 'preparing'].includes(order.status)
  );
  const todaysRevenue = todaysOrders
    .filter(order => order.status === 'completed')
    .reduce((total, order) => total + order.subtotal, 0);

  const menuItems = [
    {
      title: "Order Taking",
      description: "Take orders for dine-in, takeout, and delivery",
      icon: ShoppingCart,
      path: "/order-taking",
      color: "gradient-primary",
      delay: "0.1s"
    },
    {
      title: "Kitchen Display",
      description: "Real-time order management for kitchen staff",
      icon: ChefHat,
      path: "/kitchen",
      color: "gradient-success",
      delay: "0.2s"
    },
    {
      title: "Billing",
      description: "Process saved orders and handle payments",
      icon: Receipt,
      path: "/billing",
      color: "from-purple-500 to-indigo-500",
      delay: "0.3s"
    },
    {
      title: "Table Management",
      description: "Manage table bookings and availability",
      icon: Users,
      path: "/tables",
      color: "gradient-secondary",
      delay: "0.4s"
    },
    {
      title: "Menu Management",
      description: "Add, edit, and organize menu items",
      icon: Calendar,
      path: "/menu",
      color: "gradient-danger",
      delay: "0.5s"
    }
  ];

  // Get recent activities from actual orders
  const recentActivities = savedOrders
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3)
    .map(order => {
      const timeAgo = Math.floor((Date.now() - new Date(order.timestamp).getTime()) / 60000);
      let description = '';
      let icon = ShoppingCart;
      let iconColor = 'text-blue-600';
      
      switch (order.status) {
        case 'completed':
          description = `Order completed`;
          icon = CheckCircle;
          iconColor = 'text-green-600';
          break;
        case 'ready':
          description = `Order ready for ${order.orderType}`;
          icon = Clock;
          iconColor = 'text-orange-600';
          break;
        case 'preparing':
          description = `Order in kitchen`;
          icon = ChefHat;
          iconColor = 'text-yellow-600';
          break;
        default:
          description = `New ${order.orderType} order`;
          icon = ShoppingCart;
          iconColor = 'text-blue-600';
      }

      return {
        title: `${order.tokenNumber} ${description}`,
        description: `${order.tableNumber ? `Table ${order.tableNumber}` : order.customerName || 'Customer'} • ${timeAgo === 0 ? 'Just now' : `${timeAgo} min ago`}`,
        icon,
        iconColor
      };
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Enhanced Header with glass effect */}
      <header className="glass-effect border-b-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center animate-fade-in">
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500">
                <ChefHat className="h-8 w-8 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  RestaurantOS
                </h1>
                <p className="text-xs text-gray-600">Restaurant Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Button variant="outline" size="sm" className="hover-lift">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
              <Button variant="outline" size="sm" className="hover-lift">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
          <p className="text-gray-600 text-lg">Manage your restaurant operations efficiently</p>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect hover-lift hover-glow animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Today's Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{todaysOrders.length}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">
                      {todaysOrders.length > 0 ? 'Active business' : 'Start taking orders'}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect hover-lift hover-glow animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{activeOrders.length}</p>
                  <div className="flex items-center mt-2">
                    <Clock className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm text-blue-600">
                      {activeOrders.length > 0 ? 'In progress' : 'All caught up'}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect hover-lift hover-glow animate-scale-in" style={{ animationDelay: "0.3s" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Kitchen Queue</p>
                  <p className="text-3xl font-bold text-gray-900">{kitchenQueue.length}</p>
                  <div className="flex items-center mt-2">
                    <ChefHat className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">
                      {kitchenQueue.length > 0 ? 'Orders cooking' : 'Kitchen ready'}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500">
                  <ChefHat className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect hover-lift hover-glow animate-scale-in" style={{ animationDelay: "0.4s" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">₹{todaysRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600">
                      {todaysRevenue > 0 ? 'Revenue earned' : 'No sales yet'}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {menuItems.map((card, index) => (
            <Card 
              key={index} 
              className="glass-effect hover-lift hover-glow cursor-pointer group animate-fade-in-up overflow-hidden"
              style={{ animationDelay: card.delay }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2 group-hover:text-orange-600 transition-colors">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base">
                      {card.description}
                    </CardDescription>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-orange-100 group-hover:to-amber-100 transition-all duration-300">
                    <card.icon className="h-12 w-12 text-gray-600 group-hover:text-orange-600 transition-colors duration-300" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <Button 
                  onClick={() => navigate(card.path)}
                  className={`w-full ${card.color} text-white hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
                  size="lg"
                >
                  Open {card.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-12 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          {recentActivities.length === 0 ? (
            <Card className="glass-effect">
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium mb-2">No recent activity</p>
                <p className="text-gray-400 text-sm">Start taking orders to see activity here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentActivities.map((activity, index) => (
                <Card key={index} className="glass-effect hover-lift">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${activity.iconColor.includes('green') ? 'bg-green-100' : 
                        activity.iconColor.includes('orange') ? 'bg-orange-100' :
                        activity.iconColor.includes('yellow') ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                        <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;

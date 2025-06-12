
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingCart, 
  ChefHat, 
  Users, 
  Receipt,
  BarChart3,
  Settings,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useOrderContext } from "@/contexts/OrderContext";

const Index = () => {
  const navigate = useNavigate();
  const { savedOrders, completedOrders } = useOrderContext();

  // Calculate real-time statistics
  const stats = {
    pendingOrders: savedOrders.filter(order => order.status === 'saved' || order.status === 'preparing').length,
    readyOrders: savedOrders.filter(order => order.status === 'ready').length,
    todayRevenue: [...savedOrders, ...completedOrders]
      .filter(order => {
        const today = new Date();
        const orderDate = new Date(order.timestamp);
        return orderDate.toDateString() === today.toDateString();
      })
      .reduce((sum, order) => sum + order.subtotal, 0),
    totalOrders: savedOrders.length + completedOrders.length
  };

  const modules = [
    {
      title: "Order Taking",
      description: "Take new orders for dine-in, takeout, and delivery",
      icon: ShoppingCart,
      path: "/order-taking",
      color: "from-blue-500 to-blue-600",
      stats: `${stats.pendingOrders} Pending`
    },
    {
      title: "Kitchen Display",
      description: "View and manage orders in the kitchen",
      icon: ChefHat,
      path: "/kitchen",
      color: "from-orange-500 to-red-500",
      stats: `${stats.readyOrders} Ready`
    },
    {
      title: "Billing & Payments",
      description: "Process payments and print receipts",
      icon: Receipt,
      path: "/billing",
      color: "from-green-500 to-emerald-500",
      stats: `${stats.readyOrders} To Bill`
    },
    {
      title: "Table Management",
      description: "Manage table bookings and reservations",
      icon: Users,
      path: "/tables",
      color: "from-purple-500 to-indigo-500",
      stats: "8 Tables"
    },
    {
      title: "Menu Management",
      description: "Update menu items, prices, and availability",
      icon: ChefHat,
      path: "/menu",
      color: "from-pink-500 to-rose-500",
      stats: "Active Menu"
    },
    {
      title: "Reports & Analytics",
      description: "View sales reports and business insights",
      icon: BarChart3,
      path: "/reports",
      color: "from-cyan-500 to-blue-500",
      stats: `₹${stats.todayRevenue.toFixed(0)} Today`
    },
    {
      title: "Settings",
      description: "Configure restaurant settings and preferences",
      icon: Settings,
      path: "/settings",
      color: "from-gray-500 to-slate-600",
      stats: "Configure"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center animate-fade-in">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500">
                <ChefHat className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Restaurant Management
                </h1>
                <p className="text-sm text-gray-600">Complete Food Ordering & Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 animate-fade-in">
              <div className="hidden sm:flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-lg text-orange-600">{stats.totalOrders}</p>
                  <p className="text-gray-600">Total Orders</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg text-green-600">₹{stats.todayRevenue.toFixed(0)}</p>
                  <p className="text-gray-600">Today's Revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 opacity-80" />
                <div className="ml-3">
                  <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                  <p className="text-blue-100 text-sm">Pending Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Receipt className="h-8 w-8 opacity-80" />
                <div className="ml-3">
                  <p className="text-2xl font-bold">{stats.readyOrders}</p>
                  <p className="text-green-100 text-sm">Ready to Bill</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 opacity-80" />
                <div className="ml-3">
                  <p className="text-2xl font-bold">₹{stats.todayRevenue.toFixed(0)}</p>
                  <p className="text-purple-100 text-sm">Today Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 opacity-80" />
                <div className="ml-3">
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  <p className="text-orange-100 text-sm">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Card 
                key={module.title}
                className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm hover:bg-white cursor-pointer"
                onClick={() => navigate(module.path)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${module.color} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {module.stats}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-orange-600 transition-colors">
                    {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{module.description}</p>
                  <Button 
                    className={`w-full bg-gradient-to-r ${module.color} hover:opacity-90 transition-opacity`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(module.path);
                    }}
                  >
                    Open Module
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-amber-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-amber-800">Quick Actions</h3>
                    <p className="text-amber-700">Jump to the most common tasks</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate("/order-taking")}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    New Order
                  </Button>
                  <Button 
                    onClick={() => navigate("/kitchen")}
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    Kitchen View
                  </Button>
                  <Button 
                    onClick={() => navigate("/billing")}
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    Process Bills
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;

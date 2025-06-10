
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChefHat, 
  Users, 
  ShoppingCart, 
  Calendar,
  BarChart3,
  Settings
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const dashboardCards = [
    {
      title: "Order Taking",
      description: "Take orders for dine-in, takeout, and delivery",
      icon: ShoppingCart,
      path: "/order-taking",
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      title: "Kitchen Display",
      description: "Real-time order management for kitchen staff",
      icon: ChefHat,
      path: "/kitchen",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Table Management",
      description: "Manage table bookings and availability",
      icon: Users,
      path: "/tables",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Menu Management",
      description: "Add, edit, and organize menu items",
      icon: Calendar,
      path: "/menu",
      color: "bg-purple-500 hover:bg-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChefHat className="h-8 w-8 text-orange-500 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">RestaurantOS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Manage your restaurant operations efficiently</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Orders</p>
                  <p className="text-2xl font-bold text-gray-900">42</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Tables</p>
                  <p className="text-2xl font-bold text-gray-900">8/15</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Kitchen Queue</p>
                  <p className="text-2xl font-bold text-gray-900">6</p>
                </div>
                <ChefHat className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹12,450</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {dashboardCards.map((card, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{card.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {card.description}
                    </CardDescription>
                  </div>
                  <card.icon className="h-12 w-12 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate(card.path)}
                  className={`w-full ${card.color} text-white transition-colors`}
                >
                  Open {card.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;

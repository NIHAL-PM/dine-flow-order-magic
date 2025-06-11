
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { 
  ShoppingCart, 
  Users, 
  ChefHat, 
  CreditCard, 
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

const QuickActions = () => {
  const { orders, tables, getDailyStats } = useRestaurant();
  const stats = getDailyStats();
  
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const availableTables = tables.filter(t => t.status === 'available').length;

  const quickStats = [
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Preparing",
      value: preparingOrders,
      icon: ChefHat,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Ready to Serve",
      value: readyOrders,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Occupied Tables",
      value: `${occupiedTables}/${tables.length}`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Today's Revenue",
      value: `₹${stats.totalRevenue.toFixed(0)}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Orders Today",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {quickStats.map((stat, index) => (
        <Card key={index} className="glass-effect hover-lift transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickActions;

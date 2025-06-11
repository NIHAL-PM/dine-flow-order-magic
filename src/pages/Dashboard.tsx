
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useRestaurant } from "@/contexts/RestaurantContext";
import QuickActions from "@/components/QuickActions";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ShoppingCart, 
  Users, 
  ChefHat, 
  CreditCard, 
  TrendingUp,
  Clock,
  Eye,
  ArrowRight
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { orders, getDailyStats } = useRestaurant();
  const stats = getDailyStats();
  
  const recentOrders = orders
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const orderStatusData = [
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: '#eab308' },
    { name: 'Preparing', value: orders.filter(o => o.status === 'preparing').length, color: '#f97316' },
    { name: 'Ready', value: orders.filter(o => o.status === 'ready').length, color: '#22c55e' },
    { name: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: '#10b981' }
  ];

  const popularItemsData = stats.popularItems.map(item => ({
    name: item.item.substring(0, 10),
    orders: item.count
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Restaurant Dashboard</h1>
            <p className="text-gray-600">Monitor your restaurant operations in real-time</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => navigate('/order-taking')} className="bg-blue-500 hover:bg-blue-600">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Take Order
            </Button>
            <Button onClick={() => navigate('/kitchen')} variant="outline">
              <ChefHat className="h-4 w-4 mr-2" />
              Kitchen
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="glass-effect">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/billing')}
              >
                <Eye className="h-4 w-4 mr-1" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent orders</p>
                ) : (
                  recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{order.tokenNumber}</p>
                        <p className="text-xs text-gray-600">
                          {order.orderType} • {order.items.length} items • ₹{order.total}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} variant="compact" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Popular Items */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-lg">Popular Items Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularItemsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-lg">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Order Taking', icon: ShoppingCart, path: '/order-taking', color: 'bg-blue-500' },
                { title: 'Billing', icon: CreditCard, path: '/billing', color: 'bg-green-500' },
                { title: 'Kitchen Display', icon: ChefHat, path: '/kitchen', color: 'bg-orange-500' },
                { title: 'Table Management', icon: Users, path: '/tables', color: 'bg-purple-500' }
              ].map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-20 flex-col space-y-2 hover:shadow-md transition-all"
                  onClick={() => navigate(item.path)}
                >
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium">{item.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

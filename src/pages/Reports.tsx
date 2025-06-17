
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Star,
  Download,
  Calendar,
  Target
} from "lucide-react";
import { useOrderContext } from "@/contexts/OrderContext";
import { useMenuContext } from "@/contexts/MenuContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const navigate = useNavigate();
  const { savedOrders } = useOrderContext();
  const { items } = useMenuContext();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Calculate basic metrics
  const completedOrders = savedOrders.filter(order => order.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.subtotal, 0);
  const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  
  // Sample data for charts (in real app, this would be calculated from actual data)
  const salesData = [
    { date: '2024-01-01', revenue: 1200, orders: 15 },
    { date: '2024-01-02', revenue: 1500, orders: 18 },
    { date: '2024-01-03', revenue: 1800, orders: 22 },
    { date: '2024-01-04', revenue: 1350, orders: 16 },
    { date: '2024-01-05', revenue: 1650, orders: 20 },
    { date: '2024-01-06', revenue: 2100, orders: 25 },
    { date: '2024-01-07', revenue: 1950, orders: 23 },
  ];

  const popularItems = items
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 5)
    .map(item => ({
      name: item.name,
      sales: Math.floor(Math.random() * 100) + 20,
      revenue: item.price * (Math.floor(Math.random() * 100) + 20)
    }));

  const orderTypeData = [
    { name: 'Dine-in', value: 45, color: '#8884d8' },
    { name: 'Takeout', value: 35, color: '#82ca9d' },
    { name: 'Delivery', value: 20, color: '#ffc658' },
  ];

  const hourlyData = [
    { hour: '9 AM', orders: 5 },
    { hour: '10 AM', orders: 8 },
    { hour: '11 AM', orders: 12 },
    { hour: '12 PM', orders: 25 },
    { hour: '1 PM', orders: 30 },
    { hour: '2 PM', orders: 22 },
    { hour: '3 PM', orders: 15 },
    { hour: '4 PM', orders: 10 },
    { hour: '5 PM', orders: 18 },
    { hour: '6 PM', orders: 28 },
    { hour: '7 PM', orders: 35 },
    { hour: '8 PM', orders: 32 },
    { hour: '9 PM', orders: 25 },
    { hour: '10 PM', orders: 15 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
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
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold">Reports & Analytics</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Business insights and performance</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                Today
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savedOrders.length}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +8% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{averageOrderValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +5% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7-8 PM</div>
              <p className="text-xs text-muted-foreground">
                35 orders peak
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sales">Sales Trends</TabsTrigger>
            <TabsTrigger value="popular">Popular Items</TabsTrigger>
            <TabsTrigger value="orders">Order Types</TabsTrigger>
            <TabsTrigger value="hourly">Hourly Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Orders Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="popular">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={popularItems}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={orderTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hourly">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Order Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{order.tokenNumber}</p>
                    <p className="text-sm text-gray-600">
                      {order.orderType} • {order.items.length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{order.subtotal.toFixed(2)}</p>
                    <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;

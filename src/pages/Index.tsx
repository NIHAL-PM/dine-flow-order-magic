
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SystemStatus from '@/components/SystemStatus';
import { 
  ShoppingCart, 
  CreditCard, 
  ChefHat, 
  Users, 
  Menu as MenuIcon, 
  BarChart3,
  Utensils,
  Timer,
  DollarSign,
  Smartphone
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Dashboard',
      description: 'Real-time overview of restaurant operations',
      icon: BarChart3,
      path: '/dashboard',
      color: 'bg-gradient-to-r from-purple-500 to-violet-500',
      features: ['Live Analytics', 'Order Tracking', 'Revenue Monitoring']
    },
    {
      title: 'Order Taking',
      description: 'Fast & intuitive order placement system',
      icon: ShoppingCart,
      path: '/order-taking',
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      features: ['Mobile Optimized', 'Touch Friendly', 'Quick Search']
    },
    {
      title: 'Billing System',
      description: 'Complete payment processing & bill generation',
      icon: CreditCard,
      path: '/billing',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
      features: ['Multiple Payment Methods', 'Discount Management', 'Thermal Printing']
    },
    {
      title: 'Kitchen Display',
      description: 'Real-time order management for kitchen staff',
      icon: ChefHat,
      path: '/kitchen',
      color: 'bg-gradient-to-r from-orange-500 to-amber-500',
      features: ['Order Prioritization', 'Time Tracking', 'Status Updates']
    },
    {
      title: 'Table Management',
      description: 'Interactive table layout & reservation system',
      icon: Users,
      path: '/tables',
      color: 'bg-gradient-to-r from-pink-500 to-rose-500',
      features: ['Visual Layout', 'Reservation Booking', 'Occupancy Tracking']
    },
    {
      title: 'Menu Management',
      description: 'Dynamic menu creation & inventory control',
      icon: MenuIcon,
      path: '/menu',
      color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      features: ['Category Organization', 'Price Management', 'Availability Control']
    }
  ];

  const keyBenefits = [
    { icon: Smartphone, title: 'Mobile First Design', desc: 'Touch-optimized for tablets & phones' },
    { icon: Timer, title: 'Real-time Updates', desc: 'Instant synchronization across all devices' },
    { icon: DollarSign, title: 'Revenue Optimization', desc: 'Smart analytics & reporting tools' },
    { icon: Utensils, title: 'Complete Solution', desc: 'End-to-end restaurant management' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Dine Flow
              <span className="block text-yellow-100">Order Magic</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-orange-100">
              Complete restaurant management solution with modern POS, kitchen display, 
              table management, and real-time analytics. Designed for efficiency and growth.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/dashboard')}
                className="bg-white text-orange-600 hover:bg-orange-50 font-semibold px-8 py-3"
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                Open Dashboard
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/order-taking')}
                className="border-white text-white hover:bg-white/10 font-semibold px-8 py-3"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Take Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SystemStatus />
        </div>
      </div>

      {/* Key Benefits */}
      <div className="px-4 py-12 sm:px-6 lg:px-8 bg-white/50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Dine Flow?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyBenefits.map((benefit, index) => (
              <Card key={index} className="glass-effect hover-lift text-center">
                <CardContent className="p-6">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Features Grid */}
      <div className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Complete Restaurant Solution
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to run a modern restaurant efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="glass-effect hover-lift hover-glow transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(feature.path)}
              >
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {feature.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                        <span className="text-gray-600">{feat}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(feature.path);
                    }}
                  >
                    Launch {feature.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Start taking orders, managing tables, and processing payments in minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-semibold px-8 py-3"
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              View Dashboard
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/order-taking')}
              className="border-white text-white hover:bg-white/10 font-semibold px-8 py-3"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Start Taking Orders
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dine Flow Order Magic</h3>
            <p className="text-gray-600 text-sm">
              Modern Restaurant Management System • Built for Efficiency & Growth
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Production Ready
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Mobile Optimized
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Real-time Updates
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;


import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, ChefHat, Truck, DollarSign, X } from "lucide-react";

interface OrderStatusBadgeProps {
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  variant?: 'default' | 'compact';
}

const OrderStatusBadge = ({ status, variant = 'default' }: OrderStatusBadgeProps) => {
  const statusConfig = {
    pending: { 
      label: 'Pending', 
      color: 'bg-yellow-500', 
      icon: Clock,
      textColor: 'text-yellow-800'
    },
    confirmed: { 
      label: 'Confirmed', 
      color: 'bg-blue-500', 
      icon: CheckCircle,
      textColor: 'text-blue-800'
    },
    preparing: { 
      label: 'Preparing', 
      color: 'bg-orange-500', 
      icon: ChefHat,
      textColor: 'text-orange-800'
    },
    ready: { 
      label: 'Ready', 
      color: 'bg-green-500', 
      icon: CheckCircle,
      textColor: 'text-green-800'
    },
    served: { 
      label: 'Served', 
      color: 'bg-purple-500', 
      icon: Truck,
      textColor: 'text-purple-800'
    },
    completed: { 
      label: 'Completed', 
      color: 'bg-emerald-500', 
      icon: DollarSign,
      textColor: 'text-emerald-800'
    },
    cancelled: { 
      label: 'Cancelled', 
      color: 'bg-red-500', 
      icon: X,
      textColor: 'text-red-800'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <Badge variant="outline" className={`${config.color} text-white border-0 text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`${config.color} text-white border-0`}>
      <Icon className="h-4 w-4 mr-1" />
      {config.label}
    </Badge>
  );
};

export default OrderStatusBadge;

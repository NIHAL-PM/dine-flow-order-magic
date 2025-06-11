
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
  image?: string;
  preparationTime: number; // in minutes
  ingredients: string[];
  allergens: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  spiceLevel: 'mild' | 'medium' | 'hot' | 'extra-hot';
}

export interface OrderItem extends MenuItem {
  quantity: number;
  notes?: string;
  modifiers?: string[];
}

export interface Order {
  id: string;
  tokenNumber: string;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
  total: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'upi';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  estimatedTime?: number;
  actualPrepTime?: number;
  waiterName?: string;
  specialInstructions?: string;
}

export interface Table {
  id: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: string;
  reservationName?: string;
  reservationTime?: Date;
}

interface RestaurantContextType {
  // Menu Management
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  toggleItemAvailability: (id: string) => void;
  
  // Order Management
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'tokenNumber' | 'timestamp'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrdersByStatus: (status: Order['status']) => Order[];
  
  // Table Management
  tables: Table[];
  updateTableStatus: (tableId: number, status: Table['status']) => void;
  assignOrderToTable: (tableId: number, orderId: string) => void;
  
  // Statistics
  getDailyStats: () => {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    popularItems: { item: string; count: number }[];
  };
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

interface RestaurantProviderProps {
  children: ReactNode;
}

export const RestaurantProvider: React.FC<RestaurantProviderProps> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  // Initialize with sample data
  useEffect(() => {
    const sampleMenuItems: MenuItem[] = [
      {
        id: '1',
        name: 'Margherita Pizza',
        price: 299,
        category: 'Main Course',
        description: 'Fresh tomatoes, mozzarella, basil',
        available: true,
        preparationTime: 15,
        ingredients: ['Tomato Sauce', 'Mozzarella', 'Fresh Basil', 'Olive Oil'],
        allergens: ['Dairy', 'Gluten'],
        isVegetarian: true,
        isVegan: false,
        spiceLevel: 'mild'
      },
      {
        id: '2',
        name: 'Chicken Burger',
        price: 249,
        category: 'Main Course',
        description: 'Grilled chicken, lettuce, tomato, mayo',
        available: true,
        preparationTime: 12,
        ingredients: ['Chicken Breast', 'Lettuce', 'Tomato', 'Mayo', 'Burger Bun'],
        allergens: ['Gluten', 'Eggs'],
        isVegetarian: false,
        isVegan: false,
        spiceLevel: 'mild'
      },
      {
        id: '3',
        name: 'Caesar Salad',
        price: 199,
        category: 'Appetizers',
        description: 'Romaine lettuce, parmesan, croutons, caesar dressing',
        available: true,
        preparationTime: 8,
        ingredients: ['Romaine Lettuce', 'Parmesan Cheese', 'Croutons', 'Caesar Dressing'],
        allergens: ['Dairy', 'Gluten'],
        isVegetarian: true,
        isVegan: false,
        spiceLevel: 'mild'
      },
      {
        id: '4',
        name: 'Spicy Chicken Wings',
        price: 329,
        category: 'Appetizers',
        description: 'Hot and spicy chicken wings with blue cheese dip',
        available: true,
        preparationTime: 18,
        ingredients: ['Chicken Wings', 'Hot Sauce', 'Blue Cheese', 'Celery'],
        allergens: ['Dairy'],
        isVegetarian: false,
        isVegan: false,
        spiceLevel: 'hot'
      },
      {
        id: '5',
        name: 'Vegetable Biryani',
        price: 249,
        category: 'Main Course',
        description: 'Aromatic basmati rice with mixed vegetables and spices',
        available: true,
        preparationTime: 25,
        ingredients: ['Basmati Rice', 'Mixed Vegetables', 'Biryani Masala', 'Saffron'],
        allergens: [],
        isVegetarian: true,
        isVegan: true,
        spiceLevel: 'medium'
      },
      {
        id: '6',
        name: 'Chocolate Brownie',
        price: 149,
        category: 'Desserts',
        description: 'Rich chocolate brownie with vanilla ice cream',
        available: true,
        preparationTime: 5,
        ingredients: ['Chocolate', 'Butter', 'Sugar', 'Flour', 'Vanilla Ice Cream'],
        allergens: ['Dairy', 'Gluten', 'Eggs'],
        isVegetarian: true,
        isVegan: false,
        spiceLevel: 'mild'
      },
      {
        id: '7',
        name: 'Fresh Lime Soda',
        price: 49,
        category: 'Beverages',
        description: 'Refreshing lime soda with mint',
        available: true,
        preparationTime: 3,
        ingredients: ['Fresh Lime', 'Soda Water', 'Mint', 'Sugar'],
        allergens: [],
        isVegetarian: true,
        isVegan: true,
        spiceLevel: 'mild'
      },
      {
        id: '8',
        name: 'Masala Chai',
        price: 35,
        category: 'Beverages',
        description: 'Traditional Indian spiced tea',
        available: true,
        preparationTime: 5,
        ingredients: ['Tea Leaves', 'Milk', 'Sugar', 'Cardamom', 'Ginger'],
        allergens: ['Dairy'],
        isVegetarian: true,
        isVegan: false,
        spiceLevel: 'mild'
      }
    ];

    const sampleTables: Table[] = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
      status: 'available'
    }));

    setMenuItems(sampleMenuItems);
    setTables(sampleTables);
  }, []);

  const generateTokenNumber = (orderType: Order['orderType']): string => {
    const prefix = orderType === 'dine-in' ? 'D' : orderType === 'takeout' ? 'T' : 'DEL';
    const number = orders.length + 1;
    return `${prefix}-${number.toString().padStart(3, '0')}`;
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}`
    };
    setMenuItems(prev => [...prev, newItem]);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
  };

  const toggleItemAvailability = (id: string) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, available: !item.available } : item
    ));
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'tokenNumber' | 'timestamp'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      tokenNumber: generateTokenNumber(orderData.orderType),
      timestamp: new Date()
    };
    setOrders(prev => [...prev, newOrder]);
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(order => 
      order.id === id ? { ...order, ...updates } : order
    ));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
  };

  const getOrdersByStatus = (status: Order['status']) => {
    return orders.filter(order => order.status === status);
  };

  const updateTableStatus = (tableId: number, status: Table['status']) => {
    setTables(prev => prev.map(table => 
      table.id === tableId ? { ...table, status } : table
    ));
  };

  const assignOrderToTable = (tableId: number, orderId: string) => {
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { ...table, currentOrder: orderId, status: 'occupied' as const }
        : table
    ));
  };

  const getDailyStats = () => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => 
      order.timestamp.toDateString() === today && order.status === 'completed'
    );
    
    const totalOrders = todayOrders.length;
    const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const itemCounts: Record<string, number> = {};
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });
    
    const popularItems = Object.entries(itemCounts)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { totalOrders, totalRevenue, averageOrderValue, popularItems };
  };

  return (
    <RestaurantContext.Provider
      value={{
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleItemAvailability,
        orders,
        addOrder,
        updateOrder,
        deleteOrder,
        getOrdersByStatus,
        tables,
        updateTableStatus,
        assignOrderToTable,
        getDailyStats
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

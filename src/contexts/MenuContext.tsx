
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  preparationTime: number;
  image?: string;
  allergens?: string[];
  dietary?: ('vegetarian' | 'vegan' | 'gluten-free' | 'spicy')[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  active: boolean;
}

interface MenuContextType {
  categories: MenuCategory[];
  items: MenuItem[];
  addCategory: (category: Omit<MenuCategory, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<MenuCategory>) => void;
  deleteCategory: (id: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  getItemsByCategory: (categoryId: string) => MenuItem[];
  toggleItemAvailability: (itemId: string) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
};

// Initialize with default menu data
const initializeMenuData = () => {
  const savedCategories = localStorage.getItem('restaurant_categories');
  const savedItems = localStorage.getItem('restaurant_menu_items');
  
  if (savedCategories && savedItems) {
    return {
      categories: JSON.parse(savedCategories),
      items: JSON.parse(savedItems)
    };
  }
  
  // Default menu data
  const defaultCategories: MenuCategory[] = [
    { id: 'appetizers', name: 'Appetizers', description: 'Start your meal', order: 1, active: true },
    { id: 'mains', name: 'Main Course', description: 'Our signature dishes', order: 2, active: true },
    { id: 'beverages', name: 'Beverages', description: 'Refreshing drinks', order: 3, active: true },
    { id: 'desserts', name: 'Desserts', description: 'Sweet endings', order: 4, active: true }
  ];
  
  const defaultItems: MenuItem[] = [
    { id: '1', name: 'Samosa', description: 'Crispy pastry with spiced filling', price: 45, category: 'appetizers', available: true, preparationTime: 10, dietary: ['vegetarian'] },
    { id: '2', name: 'Pakora', description: 'Mixed vegetable fritters', price: 65, category: 'appetizers', available: true, preparationTime: 12, dietary: ['vegetarian'] },
    { id: '3', name: 'Spring Roll', description: 'Crispy vegetable spring rolls', price: 85, category: 'appetizers', available: true, preparationTime: 15, dietary: ['vegetarian'] },
    { id: '4', name: 'Butter Chicken', description: 'Creamy tomato curry with chicken', price: 280, category: 'mains', available: true, preparationTime: 25 },
    { id: '5', name: 'Dal Makhani', description: 'Rich black lentil curry', price: 220, category: 'mains', available: true, preparationTime: 20, dietary: ['vegetarian'] },
    { id: '6', name: 'Biryani', description: 'Fragrant rice with spices and meat', price: 320, category: 'mains', available: true, preparationTime: 30 },
    { id: '7', name: 'Lassi', description: 'Traditional yogurt drink', price: 65, category: 'beverages', available: true, preparationTime: 5, dietary: ['vegetarian'] },
    { id: '8', name: 'Tea', description: 'Hot masala chai', price: 25, category: 'beverages', available: true, preparationTime: 5, dietary: ['vegetarian'] },
    { id: '9', name: 'Cold Coffee', description: 'Iced coffee with cream', price: 85, category: 'beverages', available: true, preparationTime: 8 },
    { id: '10', name: 'Gulab Jamun', description: 'Sweet milk dumplings in syrup', price: 95, category: 'desserts', available: true, preparationTime: 5, dietary: ['vegetarian'] }
  ];
  
  localStorage.setItem('restaurant_categories', JSON.stringify(defaultCategories));
  localStorage.setItem('restaurant_menu_items', JSON.stringify(defaultItems));
  
  return { categories: defaultCategories, items: defaultItems };
};

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const initialData = initializeMenuData();
  const [categories, setCategories] = useState<MenuCategory[]>(initialData.categories);
  const [items, setItems] = useState<MenuItem[]>(initialData.items);

  const addCategory = (categoryData: Omit<MenuCategory, 'id'>) => {
    const newCategory: MenuCategory = {
      ...categoryData,
      id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setCategories(prev => {
      const updated = [...prev, newCategory];
      localStorage.setItem('restaurant_categories', JSON.stringify(updated));
      return updated;
    });
  };

  const updateCategory = (id: string, updates: Partial<MenuCategory>) => {
    setCategories(prev => {
      const updated = prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat);
      localStorage.setItem('restaurant_categories', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => {
      const updated = prev.filter(cat => cat.id !== id);
      localStorage.setItem('restaurant_categories', JSON.stringify(updated));
      return updated;
    });
    
    // Also remove items in this category
    setItems(prev => {
      const updated = prev.filter(item => item.category !== id);
      localStorage.setItem('restaurant_menu_items', JSON.stringify(updated));
      return updated;
    });
  };

  const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setItems(prev => {
      const updated = [...prev, newItem];
      localStorage.setItem('restaurant_menu_items', JSON.stringify(updated));
      return updated;
    });
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, ...updates } : item);
      localStorage.setItem('restaurant_menu_items', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteMenuItem = (id: string) => {
    setItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('restaurant_menu_items', JSON.stringify(updated));
      return updated;
    });
  };

  const getItemsByCategory = (categoryId: string) => {
    return items.filter(item => item.category === categoryId);
  };

  const toggleItemAvailability = (itemId: string) => {
    updateMenuItem(itemId, { available: !items.find(item => item.id === itemId)?.available });
  };

  return (
    <MenuContext.Provider value={{
      categories,
      items,
      addCategory,
      updateCategory,
      deleteCategory,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      getItemsByCategory,
      toggleItemAvailability
    }}>
      {children}
    </MenuContext.Provider>
  );
};


import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/services/database';

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
  refreshMenu: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
};

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    // Load initial data
    refreshMenu();

    // Subscribe to database changes
    const unsubscribeCategories = db.subscribe('categories', setCategories);
    const unsubscribeItems = db.subscribe('menuItems', setItems);

    return () => {
      unsubscribeCategories();
      unsubscribeItems();
    };
  }, []);

  const refreshMenu = () => {
    setCategories(db.getData('categories'));
    setItems(db.getData('menuItems'));
  };

  const addCategory = (categoryData: Omit<MenuCategory, 'id'>) => {
    const newCategory: MenuCategory = {
      ...categoryData,
      id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const currentCategories = db.getData('categories');
    db.setData('categories', [...currentCategories, newCategory]);
  };

  const updateCategory = (id: string, updates: Partial<MenuCategory>) => {
    const currentCategories = db.getData('categories');
    const updatedCategories = currentCategories.map((cat: MenuCategory) => 
      cat.id === id ? { ...cat, ...updates } : cat
    );
    db.setData('categories', updatedCategories);
  };

  const deleteCategory = (id: string) => {
    const currentCategories = db.getData('categories');
    const filteredCategories = currentCategories.filter((cat: MenuCategory) => cat.id !== id);
    db.setData('categories', filteredCategories);
    
    // Also remove items in this category
    const currentItems = db.getData('menuItems');
    const filteredItems = currentItems.filter((item: MenuItem) => item.category !== id);
    db.setData('menuItems', filteredItems);
  };

  const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const currentItems = db.getData('menuItems');
    db.setData('menuItems', [...currentItems, newItem]);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    const currentItems = db.getData('menuItems');
    const updatedItems = currentItems.map((item: MenuItem) => 
      item.id === id ? { ...item, ...updates } : item
    );
    db.setData('menuItems', updatedItems);
  };

  const deleteMenuItem = (id: string) => {
    const currentItems = db.getData('menuItems');
    const filteredItems = currentItems.filter((item: MenuItem) => item.id !== id);
    db.setData('menuItems', filteredItems);
  };

  const getItemsByCategory = (categoryId: string) => {
    return items.filter(item => item.category === categoryId);
  };

  const toggleItemAvailability = (itemId: string) => {
    const item = items.find(item => item.id === itemId);
    if (item) {
      updateMenuItem(itemId, { available: !item.available });
    }
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
      toggleItemAvailability,
      refreshMenu
    }}>
      {children}
    </MenuContext.Provider>
  );
};

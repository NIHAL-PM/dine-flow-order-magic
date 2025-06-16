
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { enhancedDB } from '@/services/enhancedDatabase';

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
  cost?: number;
  stockQuantity?: number;
  popularity?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  active: boolean;
  image?: string;
}

interface MenuContextType {
  categories: MenuCategory[];
  items: MenuItem[];
  addCategory: (category: Omit<MenuCategory, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<MenuCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  getItemsByCategory: (categoryId: string) => MenuItem[];
  toggleItemAvailability: (itemId: string) => Promise<void>;
  refreshMenu: () => Promise<void>;
  searchItems: (query: string) => MenuItem[];
  getPopularItems: (limit?: number) => MenuItem[];
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
    refreshMenu();

    const unsubscribeCategories = enhancedDB.subscribe('categories', setCategories);
    const unsubscribeItems = enhancedDB.subscribe('menuItems', setItems);

    return () => {
      unsubscribeCategories();
      unsubscribeItems();
    };
  }, []);

  const refreshMenu = async () => {
    try {
      const [categoriesData, itemsData] = await Promise.all([
        enhancedDB.getData('categories'),
        enhancedDB.getData('menuItems')
      ]);
      setCategories(categoriesData);
      setItems(itemsData);
    } catch (error) {
      console.error('Failed to refresh menu:', error);
    }
  };

  const addCategory = async (categoryData: Omit<MenuCategory, 'id'>) => {
    try {
      const newCategory: MenuCategory = {
        ...categoryData,
        id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      await enhancedDB.addItem('categories', newCategory);
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<MenuCategory>) => {
    try {
      await enhancedDB.updateItem('categories', id, updates);
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await enhancedDB.deleteItem('categories', id);
      
      // Also remove items in this category
      const categoryItems = items.filter(item => item.category === id);
      for (const item of categoryItems) {
        await enhancedDB.deleteItem('menuItems', item.id);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  };

  const addMenuItem = async (itemData: Omit<MenuItem, 'id'>) => {
    try {
      const newItem: MenuItem = {
        ...itemData,
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        popularity: 0,
        stockQuantity: itemData.stockQuantity || 100
      };
      
      await enhancedDB.addItem('menuItems', newItem);
    } catch (error) {
      console.error('Failed to add menu item:', error);
      throw error;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      await enhancedDB.updateItem('menuItems', id, updates);
    } catch (error) {
      console.error('Failed to update menu item:', error);
      throw error;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      await enhancedDB.deleteItem('menuItems', id);
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      throw error;
    }
  };

  const getItemsByCategory = (categoryId: string) => {
    return items.filter(item => item.category === categoryId && item.available);
  };

  const toggleItemAvailability = async (itemId: string) => {
    try {
      const item = items.find(item => item.id === itemId);
      if (item) {
        await updateMenuItem(itemId, { available: !item.available });
      }
    } catch (error) {
      console.error('Failed to toggle item availability:', error);
      throw error;
    }
  };

  const searchItems = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getPopularItems = (limit: number = 10) => {
    return items
      .filter(item => item.available)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limit);
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
      refreshMenu,
      searchItems,
      getPopularItems
    }}>
      {children}
    </MenuContext.Provider>
  );
};

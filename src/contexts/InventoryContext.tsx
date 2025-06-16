
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { enhancedDB } from '@/services/enhancedDatabase';

export interface InventoryItem {
  id: string;
  menuItemId: string;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  cost: number;
  supplier?: string;
  lastRestocked?: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
  timestamp: Date;
  userId?: string;
}

interface InventoryContextType {
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  adjustStock: (itemId: string, quantity: number, reason: string) => Promise<void>;
  restockItem: (itemId: string, quantity: number, cost?: number) => Promise<void>;
  consumeStock: (itemId: string, quantity: number, reason: string) => Promise<void>;
  getLowStockItems: () => InventoryItem[];
  getExpiringItems: (days: number) => InventoryItem[];
  getItemById: (id: string) => InventoryItem | undefined;
  refreshInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventoryContext = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventoryContext must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    refreshInventory();

    const unsubscribeInventory = enhancedDB.subscribe('inventory', setInventory);

    return unsubscribeInventory;
  }, []);

  const refreshInventory = async () => {
    try {
      const inventoryData = await enhancedDB.getData('inventory');
      setInventory(inventoryData);
    } catch (error) {
      console.error('Failed to refresh inventory:', error);
    }
  };

  const addStockMovement = async (movement: Omit<StockMovement, 'id' | 'timestamp'>) => {
    try {
      const newMovement: StockMovement = {
        ...movement,
        id: `movement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      
      // In a real app, stock movements would be stored in database
      setStockMovements(prev => [newMovement, ...prev]);
    } catch (error) {
      console.error('Failed to add stock movement:', error);
    }
  };

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const newItem: InventoryItem = {
        ...itemData,
        id: `inventory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await enhancedDB.addItem('inventory', newItem);
      return newItem.id;
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      throw error;
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      await enhancedDB.updateItem('inventory', id, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      throw error;
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      await enhancedDB.deleteItem('inventory', id);
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      throw error;
    }
  };

  const adjustStock = async (itemId: string, quantity: number, reason: string) => {
    try {
      const item = inventory.find(i => i.id === itemId);
      if (!item) throw new Error('Inventory item not found');

      const newStock = Math.max(0, item.currentStock + quantity);
      await updateInventoryItem(itemId, { currentStock: newStock });

      await addStockMovement({
        inventoryItemId: itemId,
        type: 'adjustment',
        quantity,
        reason
      });
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      throw error;
    }
  };

  const restockItem = async (itemId: string, quantity: number, cost?: number) => {
    try {
      const item = inventory.find(i => i.id === itemId);
      if (!item) throw new Error('Inventory item not found');

      const updates: Partial<InventoryItem> = {
        currentStock: item.currentStock + quantity,
        lastRestocked: new Date()
      };

      if (cost) {
        updates.cost = cost;
      }

      await updateInventoryItem(itemId, updates);

      await addStockMovement({
        inventoryItemId: itemId,
        type: 'in',
        quantity,
        reason: 'Restocked'
      });
    } catch (error) {
      console.error('Failed to restock item:', error);
      throw error;
    }
  };

  const consumeStock = async (itemId: string, quantity: number, reason: string) => {
    try {
      const item = inventory.find(i => i.id === itemId);
      if (!item) throw new Error('Inventory item not found');

      if (item.currentStock < quantity) {
        throw new Error('Insufficient stock');
      }

      await updateInventoryItem(itemId, { 
        currentStock: item.currentStock - quantity 
      });

      await addStockMovement({
        inventoryItemId: itemId,
        type: 'out',
        quantity: -quantity,
        reason
      });
    } catch (error) {
      console.error('Failed to consume stock:', error);
      throw error;
    }
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.currentStock <= item.minStock);
  };

  const getExpiringItems = (days: number) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return inventory.filter(item => 
      item.expiryDate && new Date(item.expiryDate) <= futureDate
    );
  };

  const getItemById = (id: string) => {
    return inventory.find(item => item.id === id);
  };

  return (
    <InventoryContext.Provider value={{
      inventory,
      stockMovements,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      adjustStock,
      restockItem,
      consumeStock,
      getLowStockItems,
      getExpiringItems,
      getItemById,
      refreshInventory
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

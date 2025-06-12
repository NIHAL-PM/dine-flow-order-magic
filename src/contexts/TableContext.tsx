
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: string;
  reservedBy?: string;
  reservedTime?: Date;
  customerCount?: number;
}

interface TableContextType {
  tables: Table[];
  updateTableStatus: (tableId: number, status: Table['status'], details?: Partial<Table>) => void;
  reserveTable: (tableId: number, customerName: string, time: Date, customerCount: number) => void;
  clearTable: (tableId: number) => void;
  getAvailableTables: () => Table[];
  getTableById: (tableId: number) => Table | undefined;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const useTableContext = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context;
};

// Initialize with default tables
const initializeTables = (): Table[] => {
  const savedTables = localStorage.getItem('restaurant_tables');
  if (savedTables) {
    return JSON.parse(savedTables);
  }
  
  // Default table layout
  const defaultTables: Table[] = [];
  for (let i = 1; i <= 20; i++) {
    defaultTables.push({
      id: i,
      number: i,
      capacity: i <= 10 ? 4 : i <= 15 ? 6 : 8,
      status: 'available'
    });
  }
  
  localStorage.setItem('restaurant_tables', JSON.stringify(defaultTables));
  return defaultTables;
};

export const TableProvider = ({ children }: { children: ReactNode }) => {
  const [tables, setTables] = useState<Table[]>(initializeTables);

  const updateTableStatus = (tableId: number, status: Table['status'], details?: Partial<Table>) => {
    setTables(prev => {
      const updated = prev.map(table =>
        table.id === tableId 
          ? { ...table, status, ...details }
          : table
      );
      localStorage.setItem('restaurant_tables', JSON.stringify(updated));
      return updated;
    });
  };

  const reserveTable = (tableId: number, customerName: string, time: Date, customerCount: number) => {
    updateTableStatus(tableId, 'reserved', {
      reservedBy: customerName,
      reservedTime: time,
      customerCount
    });
  };

  const clearTable = (tableId: number) => {
    updateTableStatus(tableId, 'available', {
      currentOrder: undefined,
      reservedBy: undefined,
      reservedTime: undefined,
      customerCount: undefined
    });
  };

  const getAvailableTables = () => {
    return tables.filter(table => table.status === 'available');
  };

  const getTableById = (tableId: number) => {
    return tables.find(table => table.id === tableId);
  };

  return (
    <TableContext.Provider value={{
      tables,
      updateTableStatus,
      reserveTable,
      clearTable,
      getAvailableTables,
      getTableById
    }}>
      {children}
    </TableContext.Provider>
  );
};

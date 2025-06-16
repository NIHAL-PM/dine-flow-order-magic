
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/services/database';

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
  refreshTables: () => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const useTableContext = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context;
};

export const TableProvider = ({ children }: { children: ReactNode }) => {
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    // Load initial data
    refreshTables();

    // Subscribe to database changes
    const unsubscribe = db.subscribe('tables', setTables);

    return unsubscribe;
  }, []);

  const refreshTables = () => {
    setTables(db.getData('tables'));
  };

  const updateTableStatus = (tableId: number, status: Table['status'], details?: Partial<Table>) => {
    const currentTables = db.getData('tables');
    const updatedTables = currentTables.map((table: Table) =>
      table.id === tableId 
        ? { ...table, status, ...details, updatedAt: new Date().toISOString() }
        : table
    );
    db.setData('tables', updatedTables);
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
      getTableById,
      refreshTables
    }}>
      {children}
    </TableContext.Provider>
  );
};

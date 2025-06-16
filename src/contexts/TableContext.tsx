
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { enhancedDB } from '@/services/enhancedDatabase';

export interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: string;
  reservedBy?: string;
  reservedTime?: Date;
  customerCount?: number;
  waiterAssigned?: string;
  section?: string;
  x?: number;
  y?: number;
}

export interface Reservation {
  id: string;
  tableId: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: Date;
  time: string;
  customerCount: number;
  specialRequests?: string;
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  createdAt: Date;
}

interface TableContextType {
  tables: Table[];
  reservations: Reservation[];
  updateTableStatus: (tableId: number, status: Table['status'], details?: Partial<Table>) => Promise<void>;
  reserveTable: (tableId: number, customerName: string, time: Date, customerCount: number) => Promise<void>;
  clearTable: (tableId: number) => Promise<void>;
  addReservation: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => Promise<string>;
  updateReservation: (id: string, updates: Partial<Reservation>) => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  getAvailableTables: (date?: Date, time?: string) => Table[];
  getTableById: (tableId: number) => Table | undefined;
  getReservationsForDate: (date: Date) => Reservation[];
  refreshTables: () => Promise<void>;
  initializeTables: (count: number) => Promise<void>;
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
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    refreshTables();

    const unsubscribeTables = enhancedDB.subscribe('tables', setTables);
    const unsubscribeReservations = enhancedDB.subscribe('reservations', setReservations);

    return () => {
      unsubscribeTables();
      unsubscribeReservations();
    };
  }, []);

  const refreshTables = async () => {
    try {
      const [tablesData, reservationsData] = await Promise.all([
        enhancedDB.getData('tables'),
        enhancedDB.getData('reservations')
      ]);
      setTables(tablesData);
      setReservations(reservationsData);
    } catch (error) {
      console.error('Failed to refresh tables:', error);
    }
  };

  const initializeTables = async (count: number) => {
    try {
      const existingTables = await enhancedDB.getData('tables');
      if (existingTables.length === 0) {
        const tables = [];
        for (let i = 1; i <= count; i++) {
          tables.push({
            id: i,
            number: i,
            capacity: i <= 10 ? 4 : i <= 15 ? 6 : 8,
            status: 'available' as const,
            section: i <= 10 ? 'Main' : i <= 15 ? 'Patio' : 'Private'
          });
        }
        await enhancedDB.setData('tables', tables);
      }
    } catch (error) {
      console.error('Failed to initialize tables:', error);
      throw error;
    }
  };

  const updateTableStatus = async (tableId: number, status: Table['status'], details?: Partial<Table>) => {
    try {
      await enhancedDB.updateItem('tables', tableId.toString(), {
        status,
        ...details,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update table status:', error);
      throw error;
    }
  };

  const reserveTable = async (tableId: number, customerName: string, time: Date, customerCount: number) => {
    try {
      await updateTableStatus(tableId, 'reserved', {
        reservedBy: customerName,
        reservedTime: time,
        customerCount
      });
    } catch (error) {
      console.error('Failed to reserve table:', error);
      throw error;
    }
  };

  const clearTable = async (tableId: number) => {
    try {
      await updateTableStatus(tableId, 'available', {
        currentOrder: undefined,
        reservedBy: undefined,
        reservedTime: undefined,
        customerCount: undefined
      });
    } catch (error) {
      console.error('Failed to clear table:', error);
      throw error;
    }
  };

  const addReservation = async (reservationData: Omit<Reservation, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const newReservation: Reservation = {
        ...reservationData,
        id: `reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      };
      
      await enhancedDB.addItem('reservations', newReservation);
      return newReservation.id;
    } catch (error) {
      console.error('Failed to add reservation:', error);
      throw error;
    }
  };

  const updateReservation = async (id: string, updates: Partial<Reservation>) => {
    try {
      await enhancedDB.updateItem('reservations', id, updates);
    } catch (error) {
      console.error('Failed to update reservation:', error);
      throw error;
    }
  };

  const cancelReservation = async (id: string) => {
    try {
      await updateReservation(id, { status: 'cancelled' });
    } catch (error) {
      console.error('Failed to cancel reservation:', error);
      throw error;
    }
  };

  const getAvailableTables = (date?: Date, time?: string) => {
    let availableTables = tables.filter(table => table.status === 'available');
    
    if (date && time) {
      const reservationsForDateTime = reservations.filter(reservation => 
        new Date(reservation.date).toDateString() === date.toDateString() &&
        reservation.time === time &&
        reservation.status === 'confirmed'
      );
      
      const reservedTableIds = reservationsForDateTime.map(r => r.tableId);
      availableTables = availableTables.filter(table => 
        !reservedTableIds.includes(table.id)
      );
    }
    
    return availableTables;
  };

  const getTableById = (tableId: number) => {
    return tables.find(table => table.id === tableId);
  };

  const getReservationsForDate = (date: Date) => {
    return reservations.filter(reservation => 
      new Date(reservation.date).toDateString() === date.toDateString()
    );
  };

  return (
    <TableContext.Provider value={{
      tables,
      reservations,
      updateTableStatus,
      reserveTable,
      clearTable,
      addReservation,
      updateReservation,
      cancelReservation,
      getAvailableTables,
      getTableById,
      getReservationsForDate,
      refreshTables,
      initializeTables
    }}>
      {children}
    </TableContext.Provider>
  );
};

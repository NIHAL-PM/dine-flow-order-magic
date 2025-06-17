
import { enhancedDB } from './enhancedDatabase';

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
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  createdAt: Date;
  updatedAt?: Date;
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCount: number;
  arrivalTime: Date;
  estimatedWaitTime: number;
  status: 'waiting' | 'seated' | 'cancelled';
  priority: 'normal' | 'high' | 'vip';
  notified?: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reservedCount: number;
  maxCapacity: number;
}

class ReservationService {
  private waitlist: WaitlistEntry[] = [];
  private timeSlots: TimeSlot[] = [];

  constructor() {
    this.initializeTimeSlots();
    this.loadWaitlist();
  }

  private initializeTimeSlots() {
    // Generate time slots from 9 AM to 11 PM in 30-minute intervals
    const slots = [];
    for (let hour = 9; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 23 && minute > 0) break; // Stop at 11:00 PM
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time,
          available: true,
          reservedCount: 0,
          maxCapacity: 10 // Default capacity per slot
        });
      }
    }
    this.timeSlots = slots;
  }

  private async loadWaitlist() {
    try {
      const stored = localStorage.getItem('restaurant_waitlist');
      if (stored) {
        this.waitlist = JSON.parse(stored).map((entry: any) => ({
          ...entry,
          arrivalTime: new Date(entry.arrivalTime)
        }));
      }
    } catch (error) {
      console.error('Failed to load waitlist:', error);
      this.waitlist = [];
    }
  }

  private async saveWaitlist() {
    try {
      localStorage.setItem('restaurant_waitlist', JSON.stringify(this.waitlist));
    } catch (error) {
      console.error('Failed to save waitlist:', error);
    }
  }

  async addToWaitlist(entry: Omit<WaitlistEntry, 'id' | 'estimatedWaitTime' | 'status'>): Promise<string> {
    const newEntry: WaitlistEntry = {
      ...entry,
      id: `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      estimatedWaitTime: this.calculateEstimatedWaitTime(entry.customerCount),
      status: 'waiting'
    };

    this.waitlist.push(newEntry);
    await this.saveWaitlist();
    
    // Trigger notification
    this.notifyWaitlistUpdate();
    
    return newEntry.id;
  }

  async updateWaitlistEntry(id: string, updates: Partial<WaitlistEntry>): Promise<void> {
    const index = this.waitlist.findIndex(entry => entry.id === id);
    if (index !== -1) {
      this.waitlist[index] = { ...this.waitlist[index], ...updates };
      await this.saveWaitlist();
      this.notifyWaitlistUpdate();
    }
  }

  getWaitlist(): WaitlistEntry[] {
    return this.waitlist.filter(entry => entry.status === 'waiting')
      .sort((a, b) => {
        // Sort by priority first, then by arrival time
        if (a.priority === 'vip' && b.priority !== 'vip') return -1;
        if (b.priority === 'vip' && a.priority !== 'vip') return 1;
        if (a.priority === 'high' && b.priority === 'normal') return -1;
        if (b.priority === 'high' && a.priority === 'normal') return 1;
        return a.arrivalTime.getTime() - b.arrivalTime.getTime();
      });
  }

  private calculateEstimatedWaitTime(customerCount: number): number {
    // Calculate based on current waitlist and table availability
    const waitingEntries = this.waitlist.filter(entry => entry.status === 'waiting');
    const baseWaitTime = 15; // Base wait time in minutes
    const additionalTimePerGroup = 10;
    const additionalTimeForLargeParty = customerCount > 4 ? 15 : 0;
    
    return baseWaitTime + (waitingEntries.length * additionalTimePerGroup) + additionalTimeForLargeParty;
  }

  async createReservation(reservation: Omit<Reservation, 'id' | 'createdAt'>): Promise<string> {
    const newReservation: Reservation = {
      ...reservation,
      id: `reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    await enhancedDB.addItem('reservations', newReservation);
    this.updateTimeSlotAvailability(reservation.date, reservation.time, 1);
    
    return newReservation.id;
  }

  async updateReservation(id: string, updates: Partial<Reservation>): Promise<void> {
    const existing = await enhancedDB.getItem('reservations', id);
    if (existing) {
      await enhancedDB.updateItem('reservations', id, {
        ...updates,
        updatedAt: new Date()
      });
    }
  }

  async cancelReservation(id: string): Promise<void> {
    const reservation = await enhancedDB.getItem('reservations', id);
    if (reservation) {
      await this.updateReservation(id, { status: 'cancelled' });
      this.updateTimeSlotAvailability(new Date(reservation.date), reservation.time, -1);
    }
  }

  getAvailableTimeSlots(date: Date): TimeSlot[] {
    // For this demo, return all time slots as available
    // In a real implementation, this would check against existing reservations
    return this.timeSlots.map(slot => ({
      ...slot,
      available: slot.reservedCount < slot.maxCapacity
    }));
  }

  private updateTimeSlotAvailability(date: Date, time: string, change: number) {
    const slot = this.timeSlots.find(s => s.time === time);
    if (slot) {
      slot.reservedCount += change;
      slot.available = slot.reservedCount < slot.maxCapacity;
    }
  }

  async getReservationsForDate(date: Date): Promise<Reservation[]> {
    try {
      const allReservations = await enhancedDB.getData('reservations');
      return allReservations.filter((reservation: Reservation) => 
        new Date(reservation.date).toDateString() === date.toDateString()
      );
    } catch (error) {
      console.error('Failed to get reservations for date:', error);
      return [];
    }
  }

  async seatWaitlistCustomer(waitlistId: string, tableId: number): Promise<void> {
    await this.updateWaitlistEntry(waitlistId, { 
      status: 'seated',
      notified: true 
    });
    
    // Trigger notification for next customer in line
    const nextCustomer = this.getWaitlist()[0];
    if (nextCustomer) {
      this.notifyCustomer(nextCustomer.id, 'Your table will be ready soon!');
    }
  }

  private notifyCustomer(waitlistId: string, message: string) {
    // Trigger custom event for notification system
    window.dispatchEvent(new CustomEvent('waitlistNotification', {
      detail: { waitlistId, message, timestamp: new Date() }
    }));
  }

  private notifyWaitlistUpdate() {
    window.dispatchEvent(new CustomEvent('waitlistUpdate', {
      detail: { waitlist: this.getWaitlist(), timestamp: new Date() }
    }));
  }

  // Customer history and analytics
  async getCustomerHistory(phone: string): Promise<Reservation[]> {
    try {
      const allReservations = await enhancedDB.getData('reservations');
      return allReservations.filter((reservation: Reservation) => 
        reservation.customerPhone === phone
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Failed to get customer history:', error);
      return [];
    }
  }

  async getReservationAnalytics(startDate: Date, endDate: Date) {
    try {
      const reservations = await enhancedDB.getData('reservations');
      const filtered = reservations.filter((r: Reservation) => {
        const resDate = new Date(r.date);
        return resDate >= startDate && resDate <= endDate;
      });

      return {
        totalReservations: filtered.length,
        completedReservations: filtered.filter((r: Reservation) => r.status === 'completed').length,
        cancelledReservations: filtered.filter((r: Reservation) => r.status === 'cancelled').length,
        noShowRate: filtered.filter((r: Reservation) => r.status === 'no_show').length / filtered.length * 100,
        averagePartySize: filtered.reduce((sum: number, r: Reservation) => sum + r.customerCount, 0) / filtered.length,
        popularTimeSlots: this.getPopularTimeSlots(filtered)
      };
    } catch (error) {
      console.error('Failed to get reservation analytics:', error);
      return null;
    }
  }

  private getPopularTimeSlots(reservations: Reservation[]) {
    const timeSlotCounts = reservations.reduce((acc: { [key: string]: number }, reservation) => {
      acc[reservation.time] = (acc[reservation.time] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(timeSlotCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([time, count]) => ({ time, count }));
  }
}

export const reservationService = new ReservationService();

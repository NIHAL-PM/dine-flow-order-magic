
import { enhancedDB } from './enhancedDatabase';

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  date: string;
  time: string;
  duration: number; // in minutes
  tableId?: string;
  status: 'confirmed' | 'arrived' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
  reminders: ReminderLog[];
  source: 'phone' | 'walk_in' | 'online' | 'app';
}

export interface ReminderLog {
  id: string;
  type: 'sms' | 'email' | 'call';
  sentAt: Date;
  status: 'sent' | 'delivered' | 'failed';
}

export interface TimeSlot {
  time: string;
  availableTables: number;
  totalCapacity: number;
  reservations: string[]; // reservation IDs
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  estimatedWaitTime: number;
  priority: 'normal' | 'high' | 'vip';
  status: 'waiting' | 'called' | 'seated' | 'left';
  joinedAt: Date;
  notifiedAt?: Date;
}

class ReservationService {
  private reservations: Map<string, Reservation> = new Map();
  private waitlist: Map<string, WaitlistEntry> = new Map();
  private timeSlots: Map<string, TimeSlot[]> = new Map(); // date -> time slots

  async initialize(): Promise<void> {
    try {
      await this.loadReservations();
      await this.loadWaitlist();
      this.generateTimeSlots();
    } catch (error) {
      console.error('Failed to initialize reservation service:', error);
    }
  }

  private async loadReservations(): Promise<void> {
    try {
      const reservations = await enhancedDB.getData('reservations');
      if (Array.isArray(reservations)) {
        reservations.forEach(reservation => {
          this.reservations.set(reservation.id, reservation);
        });
      }
    } catch (error) {
      console.error('Failed to load reservations:', error);
    }
  }

  private async loadWaitlist(): Promise<void> {
    try {
      // Waitlist could be stored in a separate table or as part of reservations
      const today = new Date().toDateString();
      const todayReservations = Array.from(this.reservations.values())
        .filter(r => new Date(r.date).toDateString() === today && r.status === 'waiting');
      
      // Convert to waitlist entries if needed
    } catch (error) {
      console.error('Failed to load waitlist:', error);
    }
  }

  private generateTimeSlots(): void {
    const today = new Date();
    for (let i = 0; i < 30; i++) { // Generate for next 30 days
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      this.timeSlots.set(dateString, this.createTimeSlotsForDate(dateString));
    }
  }

  private createTimeSlotsForDate(date: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    // Generate time slots from 9 AM to 10 PM (30-minute intervals)
    for (let hour = 9; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        slots.push({
          time,
          availableTables: this.calculateAvailableTables(date, time),
          totalCapacity: this.calculateTotalCapacity(),
          reservations: this.getReservationsForSlot(date, time)
        });
      }
    }
    
    return slots;
  }

  private calculateAvailableTables(date: string, time: string): number {
    // This would integrate with table management system
    // For now, assume 20 tables available
    const totalTables = 20;
    const reservedTables = this.getReservationsForSlot(date, time).length;
    return Math.max(0, totalTables - reservedTables);
  }

  private calculateTotalCapacity(): number {
    // This would integrate with table management system
    return 80; // Assume total capacity of 80 people
  }

  private getReservationsForSlot(date: string, time: string): string[] {
    return Array.from(this.reservations.values())
      .filter(r => r.date === date && r.time === time && r.status !== 'cancelled')
      .map(r => r.id);
  }

  async createReservation(reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'reminders'>): Promise<string> {
    try {
      const id = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const reservation: Reservation = {
        ...reservationData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        reminders: []
      };

      // Validate availability
      const isAvailable = await this.checkAvailability(
        reservationData.date,
        reservationData.time,
        reservationData.partySize
      );

      if (!isAvailable) {
        throw new Error('No availability for requested time slot');
      }

      // Save to database
      await enhancedDB.addItem('reservations', reservation);
      this.reservations.set(id, reservation);

      // Update time slots
      this.updateTimeSlots(reservationData.date, reservationData.time);

      // Schedule reminder
      await this.scheduleReminder(reservation);

      // Trigger notification
      this.triggerReservationNotification('created', reservation);

      return id;
    } catch (error) {
      console.error('Failed to create reservation:', error);
      throw error;
    }
  }

  async updateReservationStatus(reservationId: string, status: Reservation['status']): Promise<void> {
    try {
      const reservation = this.reservations.get(reservationId);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      const updatedReservation = {
        ...reservation,
        status,
        updatedAt: new Date()
      };

      await enhancedDB.updateItem('reservations', reservationId, updatedReservation);
      this.reservations.set(reservationId, updatedReservation);

      // Handle table assignment when customer arrives
      if (status === 'arrived') {
        await this.assignTableForReservation(reservationId);
      }

      this.triggerReservationNotification('updated', updatedReservation);
    } catch (error) {
      console.error('Failed to update reservation status:', error);
      throw error;
    }
  }

  async checkAvailability(date: string, time: string, partySize: number): Promise<boolean> {
    try {
      const slots = this.timeSlots.get(date);
      if (!slots) return false;

      const slot = slots.find(s => s.time === time);
      if (!slot) return false;

      // Check if there are available tables that can accommodate the party size
      return slot.availableTables > 0 && slot.totalCapacity >= partySize;
    } catch (error) {
      console.error('Failed to check availability:', error);
      return false;
    }
  }

  async addToWaitlist(customerData: Omit<WaitlistEntry, 'id' | 'joinedAt' | 'estimatedWaitTime'>): Promise<string> {
    try {
      const id = `wait_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const waitlistEntry: WaitlistEntry = {
        ...customerData,
        id,
        joinedAt: new Date(),
        estimatedWaitTime: this.calculateEstimatedWaitTime(customerData.partySize)
      };

      this.waitlist.set(id, waitlistEntry);
      
      // Save to database (could use a separate waitlist table or store in reservations)
      await enhancedDB.addItem('reservations', {
        ...waitlistEntry,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        duration: 120,
        status: 'waiting' as any,
        customerName: waitlistEntry.customerName,
        customerPhone: waitlistEntry.customerPhone,
        partySize: waitlistEntry.partySize,
        createdAt: waitlistEntry.joinedAt,
        updatedAt: waitlistEntry.joinedAt,
        reminders: [],
        source: 'walk_in' as const
      });

      this.triggerWaitlistNotification('added', waitlistEntry);

      return id;
    } catch (error) {
      console.error('Failed to add to waitlist:', error);
      throw error;
    }
  }

  private calculateEstimatedWaitTime(partySize: number): number {
    // Calculate based on current waitlist and average table turnover
    const waitlistAhead = Array.from(this.waitlist.values())
      .filter(entry => entry.status === 'waiting').length;
    
    // Assume 45 minutes average table turnover
    const baseWaitTime = waitlistAhead * 15; // 15 minutes per party ahead
    const partySizeMultiplier = partySize > 4 ? 1.5 : 1;
    
    return Math.round(baseWaitTime * partySizeMultiplier);
  }

  private async assignTableForReservation(reservationId: string): Promise<void> {
    try {
      // This would integrate with table management system
      // For now, just update the reservation with a table assignment
      const reservation = this.reservations.get(reservationId);
      if (!reservation) return;

      // Find available table (simplified logic)
      const tableId = await this.findAvailableTable(reservation.partySize);
      
      if (tableId) {
        await enhancedDB.updateItem('reservations', reservationId, {
          tableId,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to assign table:', error);
    }
  }

  private async findAvailableTable(partySize: number): Promise<string | null> {
    try {
      const tables = await enhancedDB.getData('tables');
      if (Array.isArray(tables)) {
        const availableTable = tables.find((table: any) => 
          table.status === 'available' && table.capacity >= partySize
        );
        return availableTable?.id || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to find available table:', error);
      return null;
    }
  }

  private updateTimeSlots(date: string, time: string): void {
    const slots = this.timeSlots.get(date);
    if (slots) {
      const slot = slots.find(s => s.time === time);
      if (slot) {
        slot.availableTables = Math.max(0, slot.availableTables - 1);
        slot.reservations = this.getReservationsForSlot(date, time);
      }
    }
  }

  private async scheduleReminder(reservation: Reservation): Promise<void> {
    try {
      // Schedule reminder 2 hours before reservation
      const reminderTime = new Date(`${reservation.date}T${reservation.time}`);
      reminderTime.setHours(reminderTime.getHours() - 2);

      if (reminderTime > new Date()) {
        // In a real implementation, this would use a proper scheduling system
        setTimeout(async () => {
          await this.sendReminder(reservation.id);
        }, reminderTime.getTime() - Date.now());
      }
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
    }
  }

  private async sendReminder(reservationId: string): Promise<void> {
    try {
      const reservation = this.reservations.get(reservationId);
      if (!reservation || reservation.status === 'cancelled') return;

      const reminder: ReminderLog = {
        id: `reminder_${Date.now()}`,
        type: 'sms',
        sentAt: new Date(),
        status: 'sent'
      };

      reservation.reminders.push(reminder);
      await enhancedDB.updateItem('reservations', reservationId, reservation);

      this.triggerReservationNotification('reminder_sent', reservation);
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  }

  private triggerReservationNotification(type: string, reservation: Reservation): void {
    const event = new CustomEvent('reservationUpdate', {
      detail: { type, reservation, timestamp: new Date() }
    });
    window.dispatchEvent(event);
  }

  private triggerWaitlistNotification(type: string, entry: WaitlistEntry): void {
    const event = new CustomEvent('waitlistUpdate', {
      detail: { type, entry, timestamp: new Date() }
    });
    window.dispatchEvent(event);
  }

  getReservationsForDate(date: string): Reservation[] {
    return Array.from(this.reservations.values())
      .filter(r => r.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  getTimeSlotsForDate(date: string): TimeSlot[] {
    return this.timeSlots.get(date) || [];
  }

  getCurrentWaitlist(): WaitlistEntry[] {
    return Array.from(this.waitlist.values())
      .filter(entry => entry.status === 'waiting')
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
  }
}

export const reservationService = new ReservationService();

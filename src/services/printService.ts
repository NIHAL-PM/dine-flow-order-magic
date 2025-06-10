
import jsPDF from 'jspdf';

export interface PrintItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PrintOrder {
  tokenNumber: string;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  tableNumber?: number;
  items: PrintItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  timestamp: Date;
  customerInfo?: {
    name?: string;
    phone?: string;
    address?: string;
  };
}

export class PrintService {
  private static instance: PrintService;
  private thermalPrinterConnected = false;

  static getInstance(): PrintService {
    if (!PrintService.instance) {
      PrintService.instance = new PrintService();
    }
    return PrintService.instance;
  }

  // Check if thermal printer is available
  async checkThermalPrinter(): Promise<boolean> {
    try {
      // Check if Web Serial API is available
      if ('serial' in navigator) {
        const ports = await (navigator as any).serial.getPorts();
        this.thermalPrinterConnected = ports.length > 0;
        return this.thermalPrinterConnected;
      }
      return false;
    } catch (error) {
      console.warn('Thermal printer check failed:', error);
      return false;
    }
  }

  // Connect to thermal printer
  async connectThermalPrinter(): Promise<boolean> {
    try {
      if ('serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        this.thermalPrinterConnected = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to connect to thermal printer:', error);
      return false;
    }
  }

  // Generate thermal printer commands (ESC/POS)
  private generateThermalCommands(order: PrintOrder, type: 'bill' | 'kot'): string {
    let commands = '\x1B\x40'; // Initialize printer
    commands += '\x1B\x61\x01'; // Center align
    
    // Header
    commands += `${type === 'bill' ? 'CUSTOMER BILL' : 'KITCHEN ORDER TICKET'}\n`;
    commands += '================================\n';
    commands += `Restaurant Name\n`;
    commands += `Address Line 1\n`;
    commands += `Phone: +91 9876543210\n`;
    commands += '================================\n';
    
    // Order details
    commands += '\x1B\x61\x00'; // Left align
    commands += `Token: ${order.tokenNumber}\n`;
    commands += `Type: ${order.orderType.toUpperCase()}\n`;
    if (order.tableNumber) commands += `Table: ${order.tableNumber}\n`;
    commands += `Time: ${order.timestamp.toLocaleString()}\n`;
    commands += '--------------------------------\n';
    
    // Items
    order.items.forEach(item => {
      commands += `${item.name}\n`;
      commands += `  ${item.quantity} x ₹${item.price.toFixed(2)} = ₹${item.total.toFixed(2)}\n`;
    });
    
    if (type === 'bill') {
      commands += '--------------------------------\n';
      commands += `Subtotal: ₹${order.subtotal.toFixed(2)}\n`;
      if (order.discount > 0) {
        commands += `Discount: -₹${order.discount.toFixed(2)}\n`;
      }
      commands += `Tax (18%): ₹${order.tax.toFixed(2)}\n`;
      commands += '================================\n';
      commands += `TOTAL: ₹${order.total.toFixed(2)}\n`;
      commands += `Payment: ${order.paymentMethod.toUpperCase()}\n`;
      commands += '================================\n';
      commands += '\x1B\x61\x01'; // Center align
      commands += 'Thank you for your visit!\n';
    }
    
    commands += '\n\n\n\x1D\x56\x00'; // Cut paper
    return commands;
  }

  // Print to thermal printer
  async printThermal(order: PrintOrder, type: 'bill' | 'kot' = 'bill'): Promise<boolean> {
    try {
      if (!this.thermalPrinterConnected) {
        await this.connectThermalPrinter();
      }

      const commands = this.generateThermalCommands(order, type);
      
      // For demo purposes, we'll simulate printing
      console.log('Thermal print commands:', commands);
      
      // In a real implementation, you would send commands to the printer
      // const writer = port.writable.getWriter();
      // await writer.write(new TextEncoder().encode(commands));
      // writer.releaseLock();
      
      return true;
    } catch (error) {
      console.error('Thermal printing failed:', error);
      throw error;
    }
  }

  // Generate PDF bill
  generatePDFBill(order: PrintOrder): jsPDF {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Restaurant Name', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Address Line 1, City, State - 123456', 105, 30, { align: 'center' });
    doc.text('Phone: +91 9876543210 | Email: info@restaurant.com', 105, 38, { align: 'center' });
    
    // Bill title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('BILL / INVOICE', 105, 55, { align: 'center' });
    
    // Order details
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Token Number: ${order.tokenNumber}`, 20, 70);
    doc.text(`Date: ${order.timestamp.toLocaleDateString()}`, 150, 70);
    doc.text(`Time: ${order.timestamp.toLocaleTimeString()}`, 150, 78);
    doc.text(`Order Type: ${order.orderType.toUpperCase()}`, 20, 78);
    if (order.tableNumber) {
      doc.text(`Table Number: ${order.tableNumber}`, 20, 86);
    }
    
    // Items table header
    let yPos = 100;
    doc.setFont(undefined, 'bold');
    doc.text('Item', 20, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Price', 140, yPos);
    doc.text('Total', 170, yPos);
    
    // Draw line
    doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 10;
    
    // Items
    doc.setFont(undefined, 'normal');
    order.items.forEach(item => {
      doc.text(item.name, 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`₹${item.price.toFixed(2)}`, 140, yPos);
      doc.text(`₹${item.total.toFixed(2)}`, 170, yPos);
      yPos += 8;
    });
    
    // Totals
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    doc.text('Subtotal:', 140, yPos);
    doc.text(`₹${order.subtotal.toFixed(2)}`, 170, yPos);
    yPos += 8;
    
    if (order.discount > 0) {
      doc.text('Discount:', 140, yPos);
      doc.text(`-₹${order.discount.toFixed(2)}`, 170, yPos);
      yPos += 8;
    }
    
    doc.text('Tax (18%):', 140, yPos);
    doc.text(`₹${order.tax.toFixed(2)}`, 170, yPos);
    yPos += 10;
    
    doc.line(140, yPos, 190, yPos);
    yPos += 8;
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', 140, yPos);
    doc.text(`₹${order.total.toFixed(2)}`, 170, yPos);
    
    yPos += 15;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 20, yPos);
    
    // Footer
    yPos += 20;
    doc.text('Thank you for your visit!', 105, yPos, { align: 'center' });
    doc.text('Visit us again soon!', 105, yPos + 8, { align: 'center' });
    
    return doc;
  }

  // Download PDF
  downloadPDF(order: PrintOrder): void {
    const doc = this.generatePDFBill(order);
    doc.save(`bill-${order.tokenNumber}.pdf`);
  }

  // Print PDF (opens print dialog)
  printPDF(order: PrintOrder): void {
    const doc = this.generatePDFBill(order);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
}

export const printService = PrintService.getInstance();

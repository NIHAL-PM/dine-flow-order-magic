
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
  paymentMethod: 'cash' | 'card' | 'upi';
  timestamp: Date;
  customerName?: string;
  waiterName?: string;
}

class PrintService {
  private thermalPrinterConnected = false;

  async checkThermalPrinter(): Promise<boolean> {
    try {
      // Check if Web Serial API is available
      if ('serial' in navigator) {
        this.thermalPrinterConnected = true;
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Thermal printer check failed:', error);
      return false;
    }
  }

  async printThermal(order: PrintOrder, type: 'kot' | 'bill'): Promise<void> {
    try {
      if (!this.thermalPrinterConnected) {
        throw new Error('Thermal printer not connected');
      }

      const content = this.generatePrintContent(order, type);
      
      // For now, we'll simulate thermal printing by logging
      // In production, this would connect to actual thermal printer
      console.log(`Printing ${type.toUpperCase()} to thermal printer:`, content);
      
      // Simulate printing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Thermal printing failed:', error);
      throw error;
    }
  }

  printPDF(order: PrintOrder): void {
    const content = this.generatePrintContent(order, 'bill');
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill - ${order.tokenNumber}</title>
            <style>
              body { font-family: monospace; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .line { border-bottom: 1px dashed #000; margin: 10px 0; }
              .total { font-weight: bold; font-size: 16px; }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  downloadPDF(order: PrintOrder): void {
    const content = this.generatePrintContent(order, 'bill');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-${order.tokenNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private generatePrintContent(order: PrintOrder, type: 'kot' | 'bill'): string {
    const lines = [];
    
    if (type === 'kot') {
      lines.push('========== KITCHEN ORDER ==========');
      lines.push(`Token: ${order.tokenNumber}`);
      lines.push(`Type: ${order.orderType.toUpperCase()}`);
      if (order.tableNumber) lines.push(`Table: ${order.tableNumber}`);
      if (order.waiterName) lines.push(`Waiter: ${order.waiterName}`);
      lines.push(`Time: ${order.timestamp.toLocaleTimeString()}`);
      lines.push('================================');
      lines.push('');
      
      order.items.forEach(item => {
        lines.push(`${item.quantity}x ${item.name}`);
      });
    } else {
      lines.push('============= RECEIPT =============');
      lines.push('        Restaurant Name');
      lines.push('      123 Main Street');
      lines.push('     City, State 12345');
      lines.push('================================');
      lines.push(`Bill No: ${order.tokenNumber}`);
      lines.push(`Date: ${order.timestamp.toLocaleDateString()}`);
      lines.push(`Time: ${order.timestamp.toLocaleTimeString()}`);
      if (order.tableNumber) lines.push(`Table: ${order.tableNumber}`);
      if (order.customerName) lines.push(`Customer: ${order.customerName}`);
      if (order.waiterName) lines.push(`Waiter: ${order.waiterName}`);
      lines.push('================================');
      lines.push('');
      
      order.items.forEach(item => {
        lines.push(`${item.name}`);
        lines.push(`  ${item.quantity} x ₹${item.price} = ₹${item.total}`);
      });
      
      lines.push('');
      lines.push('--------------------------------');
      lines.push(`Subtotal:        ₹${order.subtotal.toFixed(2)}`);
      if (order.discount > 0) {
        lines.push(`Discount:        -₹${order.discount.toFixed(2)}`);
      }
      lines.push(`Tax (18%):       ₹${order.tax.toFixed(2)}`);
      lines.push('================================');
      lines.push(`TOTAL:           ₹${order.total.toFixed(2)}`);
      lines.push('================================');
      lines.push(`Payment: ${order.paymentMethod.toUpperCase()}`);
      lines.push('');
      lines.push('     Thank you for dining!');
      lines.push('      Please visit again');
    }
    
    return lines.join('\n');
  }
}

export const printService = new PrintService();

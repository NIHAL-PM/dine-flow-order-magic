
// Transaction logging service for audit trails and rollback capabilities
export interface Transaction {
  id: string;
  timestamp: Date;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE';
  table: string;
  entityId?: string;
  previousData?: any;
  newData?: any;
  userId?: string;
  rollbackData?: any;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
}

class TransactionLoggerService {
  private transactions: Map<string, Transaction> = new Map();
  private maxTransactions = 1000;

  logTransaction(operation: Transaction['operation'], table: string, data: any, entityId?: string, previousData?: any): string {
    const transactionId = this.generateTransactionId();
    
    const transaction: Transaction = {
      id: transactionId,
      timestamp: new Date(),
      operation,
      table,
      entityId,
      previousData,
      newData: data,
      status: 'PENDING'
    };

    this.transactions.set(transactionId, transaction);
    this.cleanupOldTransactions();
    
    return transactionId;
  }

  completeTransaction(transactionId: string): void {
    const transaction = this.transactions.get(transactionId);
    if (transaction) {
      transaction.status = 'COMPLETED';
    }
  }

  failTransaction(transactionId: string, error: string): void {
    const transaction = this.transactions.get(transactionId);
    if (transaction) {
      transaction.status = 'FAILED';
      (transaction as any).error = error;
    }
  }

  async rollbackTransaction(transactionId: string): Promise<boolean> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction || !transaction.previousData) {
      return false;
    }

    try {
      // In a real implementation, this would restore the previous data
      transaction.status = 'ROLLED_BACK';
      console.log('Transaction rolled back:', transactionId);
      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }

  getTransactionHistory(table?: string, limit = 50): Transaction[] {
    let allTransactions = Array.from(this.transactions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (table) {
      allTransactions = allTransactions.filter(t => t.table === table);
    }

    return allTransactions.slice(0, limit);
  }

  getFailedTransactions(): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.status === 'FAILED')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupOldTransactions(): void {
    if (this.transactions.size <= this.maxTransactions) return;

    const sortedTransactions = Array.from(this.transactions.entries())
      .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());

    const toRemove = sortedTransactions.slice(0, this.transactions.size - this.maxTransactions);
    toRemove.forEach(([id]) => this.transactions.delete(id));
  }

  exportTransactionLog(): string {
    const transactions = Array.from(this.transactions.values());
    return JSON.stringify(transactions, null, 2);
  }

  importTransactionLog(jsonData: string): void {
    try {
      const transactions = JSON.parse(jsonData) as Transaction[];
      transactions.forEach(transaction => {
        this.transactions.set(transaction.id, transaction);
      });
    } catch (error) {
      console.error('Failed to import transaction log:', error);
      throw error;
    }
  }
}

export const transactionLogger = new TransactionLoggerService();

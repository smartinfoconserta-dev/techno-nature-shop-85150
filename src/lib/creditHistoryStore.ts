export interface CreditTransaction {
  id: string;
  customerId: string;
  type: "add" | "remove";
  amount: number;
  description: string;
  createdAt: string;
}

const STORAGE_KEY = "credit_history_data";

export const creditHistoryStore = {
  getAllTransactions(): CreditTransaction[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getTransactionsByCustomer(customerId: string): CreditTransaction[] {
    return this.getAllTransactions().filter(t => t.customerId === customerId);
  },

  addTransaction(data: Omit<CreditTransaction, "id" | "createdAt">): CreditTransaction {
    const transactions = this.getAllTransactions();
    
    const newTransaction: CreditTransaction = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    transactions.push(newTransaction);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return newTransaction;
  },

  deleteTransaction(id: string): void {
    const transactions = this.getAllTransactions().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  },
};

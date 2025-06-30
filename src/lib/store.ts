import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bill } from './database';

interface BillHistoryState {
  bills: Bill[];
  addBill: (bill: Bill) => void;
  removeBill: (slug: string) => void;
  clearHistory: () => void;
}

export const useBillHistoryStore = create<BillHistoryState>()(
  persist(
    (set) => ({
      bills: [],
      addBill: (bill: Bill) => {
        set((state) => {
          // Check if bill already exists
          const existingBillIndex = state.bills.findIndex(b => b.slug === bill.slug);
          
          if (existingBillIndex >= 0) {
            // Update existing bill (move to top)
            const updatedBills = [...state.bills];
            updatedBills.splice(existingBillIndex, 1);
            return { bills: [bill, ...updatedBills] };
          } else {
            // Add new bill to the beginning
            return { bills: [bill, ...state.bills] };
          }
        });
      },
      removeBill: (slug: string) => {
        set((state) => ({
          bills: state.bills.filter(bill => bill.slug !== slug)
        }));
      },
      clearHistory: () => {
        set({ bills: [] });
      },
    }),
    {
      name: 'bill-history-storage',
      // Only persist the bills array
      partialize: (state) => ({ bills: state.bills }),
    }
  )
); 
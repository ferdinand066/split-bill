import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bill } from './database';

interface BillHistoryState {
  bills: Bill[];
  addBill: (bill: Bill) => void;
  removeBill: (slug: string) => void;
  clearHistory: () => void;
}

interface PasswordVerificationState {
  verifiedBills: string[]; // Store bill slugs that have been verified
  markBillAsVerified: (slug: string) => void;
  isBillVerified: (slug: string) => boolean;
  clearVerifiedBills: () => void;
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

export const usePasswordVerificationStore = create<PasswordVerificationState>()(
  persist(
    (set, get) => ({
      verifiedBills: [],
      markBillAsVerified: (slug: string) => {
        set((state) => ({
          verifiedBills: state.verifiedBills.includes(slug) 
            ? state.verifiedBills 
            : [...state.verifiedBills, slug]
        }));
      },
      isBillVerified: (slug: string) => {
        return get().verifiedBills.includes(slug);
      },
      clearVerifiedBills: () => {
        set({ verifiedBills: [] });
      },
    }),
    {
      name: 'password-verification-storage',
      // Only persist the verifiedBills array
      partialize: (state) => ({ verifiedBills: state.verifiedBills }),
    }
  )
); 
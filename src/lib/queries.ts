import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Bill,
  BillInformationDetailWithChargedUser,
  BillInformationHeaderWithPaidBy,
  BillSubject,
  BillType,
  CreateBillInformationResult,
  CreateBillResult
} from './database';
import {
  createBill,
  createBillInformationDetails,
  createBillInformationHeader,
  getBill,
  getBillInformationDetailByBillId,
  getBillInformationDetails,
  getBillInformationHeaders,
  getBillSubjects
} from './database';

// Query keys
export const queryKeys = {
  bills: ['bills'] as const,
  bill: (slug: string) => ['bills', slug] as const,
  billSubjects: (billId: number) => ['bill-subjects', billId] as const,
  billInformationHeaders: (billId: number) => ['bill-information-headers', billId] as const,
  billInformationDetails: (headerId: number) => ['bill-information-details', headerId] as const,
  billInformationDetailByBillId: (billId: number) => ['bill-information-detail-by-bill-id', billId] as const,
};

// Hooks for bills
export const useBill = (slug: string) => {
  return useQuery<Bill>({
    queryKey: queryKeys.bill(slug),
    queryFn: () => getBill(slug),
    enabled: !!slug,
  });
};

export const useCreateBill = () => {
  const queryClient = useQueryClient();
  
  return useMutation<CreateBillResult, Error, { name: string; subjects: string[] }>({
    mutationFn: ({ name, subjects }) => createBill(name, subjects),
    onSuccess: (data) => {
      // Invalidate and refetch bills list
      queryClient.invalidateQueries({ queryKey: queryKeys.bills });
      // Add the new bill to cache
      queryClient.setQueryData(queryKeys.bill(data.bill.slug), data.bill);
    },
  });
};

// Hooks for bill subjects
export const useBillSubjects = (billId: number) => {
  return useQuery<BillSubject[]>({
    queryKey: queryKeys.billSubjects(billId),
    queryFn: () => getBillSubjects(billId),
    enabled: !!billId,
  });
};

// Hooks for bill information headers
export const useBillInformationHeaders = (billId: number) => {
  return useQuery<BillInformationHeaderWithPaidBy[]>({
    queryKey: queryKeys.billInformationHeaders(billId),
    queryFn: () => getBillInformationHeaders(billId),
    enabled: !!billId,
  });
};

// Hooks for bill information details
export const useBillInformationDetails = (headerId: number) => {
  return useQuery<BillInformationDetailWithChargedUser[]>({
    queryKey: queryKeys.billInformationDetails(headerId),
    queryFn: () => getBillInformationDetails(headerId),
    enabled: !!headerId,
  });
};

export const useBillInformationDetailByBillId = (billId: number) => {
  return useQuery<BillInformationDetailWithChargedUser[]>({
    queryKey: queryKeys.billInformationDetailByBillId(billId),
    queryFn: () => getBillInformationDetailByBillId(billId),
    enabled: !!billId,
  });
};

// Mutation for adding bill information
export const useAddBillInformation = () => {
  const queryClient = useQueryClient();
  
  return useMutation<CreateBillInformationResult, Error, {
    billId: number;
    name: string;
    paidById: number;
    amount: number;
    billType: BillType;
    chargedUsers: Array<{ userId: number; amount: number }>;
  }>({
    mutationFn: async ({ 
      billId, 
      name, 
      paidById, 
      amount, 
      billType,
      chargedUsers 
    }) => {
      // First create the header
      const header = await createBillInformationHeader(billId, name, paidById, amount, billType);
      
      // Then create the details
      const details = await createBillInformationDetails(
        header.id,
        chargedUsers.map(user => ({
          chargedUserId: user.userId,
          amount: user.amount
        }))
      );
      
      return { header, details };
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch bill information headers for this bill
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.billInformationHeaders(variables.billId) 
      });
    },
  });
}; 
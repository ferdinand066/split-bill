import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Bill,
  BillInformationDetail,
  BillInformationDetailWithChargedUser,
  BillInformationHeader,
  BillInformationHeaderWithPaidBy,
  BillPayment,
  BillPaymentWithParticipants,
  BillSubject,
  BillType,
  CreateBillInformationResult,
  CreateBillResult
} from './database';
import {
  createBill,
  createBillInformationDetails,
  createBillInformationHeader,
  createBillPayment,
  deleteBillInformationHeader,
  deleteBillPayment,
  getBill,
  getBillById,
  getBillInformationDetailByBillId,
  getBillInformationDetails,
  getBillInformationHeaders,
  getBillPayments,
  getBillSubjects,
  updateBillInformationDetails,
  updateBillInformationHeader,
  updateBillPayment
} from './database';

// Query keys
export const queryKeys = {
  bills: ['bills'] as const,
  bill: (slug: string) => ['bills', slug] as const,
  billById: (id: number) => ['bills', 'id', id] as const,
  billSubjects: (billId: number) => ['bill-subjects', billId] as const,
  billInformationHeaders: (billId: number) => ['bill-information-headers', billId] as const,
  billInformationDetails: (headerId: number) => ['bill-information-details', headerId] as const,
  billInformationDetailByBillId: (billId: number) => ['bill-information-detail-by-bill-id', billId] as const,
  billPayments: (billId: number) => ['bill-payments', billId] as const,
};

// Hooks for bills
export const useBill = (slug: string) => {
  return useQuery<Bill>({
    queryKey: queryKeys.bill(slug),
    queryFn: () => getBill(slug),
    enabled: !!slug,
  });
};

export const useBillById = (id: number) => {
  return useQuery<Bill>({
    queryKey: queryKeys.billById(id),
    queryFn: () => getBillById(id),
    enabled: !!id,
  });
};

export const useCreateBill = () => {
  const queryClient = useQueryClient();
  
  return useMutation<CreateBillResult, Error, { name: string; password: string; subjects: string[] }>({
    mutationFn: ({ name, password, subjects }) => createBill(name, password, subjects),
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

export const useBillPayments = (billId: number) => {
  return useQuery<BillPaymentWithParticipants[]>({
    queryKey: queryKeys.billPayments(billId),
    queryFn: () => getBillPayments(billId),
    enabled: !!billId,
  });
};

export const useCreateBillPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation<BillPayment, Error, { billId: number; payFromId: number; payToId: number; amount: number }>({
    mutationFn: ({ billId, payFromId, payToId, amount }) => createBillPayment(billId, payFromId, payToId, amount),
    onSuccess: (_, variables) => {
      // Invalidate and refetch bill payments
      queryClient.invalidateQueries({ queryKey: queryKeys.billPayments(variables.billId) });
    },
  });
};

// Mutation for updating bill information
export const useUpdateBillInformation = () => {
  const queryClient = useQueryClient();
  
  return useMutation<{ header: BillInformationHeader; details: BillInformationDetail[] }, Error, {
    headerId: number;
    billId: number;
    name: string;
    paidById: number;
    amount: number;
    billType: BillType;
    chargedUsers: Array<{ userId: number; amount: number }>;
  }>({
    mutationFn: async ({ 
      headerId,
      name, 
      paidById, 
      amount, 
      billType,
      chargedUsers 
    }) => {
      // Update the header
      const header = await updateBillInformationHeader(headerId, name, paidById, amount, billType);
      
      // Update the details
      const details = await updateBillInformationDetails(
        headerId,
        chargedUsers.map(user => ({
          chargedUserId: user.userId,
          amount: user.amount
        }))
      );
      
      return { header, details };
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch bill information for this bill
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.billInformationHeaders(variables.billId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.billInformationDetailByBillId(variables.billId) 
      });
    },
  });
};

// Mutation for deleting bill information
export const useDeleteBillInformation = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { headerId: number; billId: number }>({
    mutationFn: ({ headerId }) => deleteBillInformationHeader(headerId),
    onSuccess: (_, variables) => {
      // Invalidate and refetch bill information for this bill
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.billInformationHeaders(variables.billId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.billInformationDetailByBillId(variables.billId) 
      });
    },
  });
};

// Mutation for updating bill payment
export const useUpdateBillPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation<BillPayment, Error, { paymentId: number; billId: number; payFromId: number; payToId: number; amount: number }>({
    mutationFn: ({ paymentId, payFromId, payToId, amount }) => updateBillPayment(paymentId, payFromId, payToId, amount),
    onSuccess: (_, variables) => {
      // Invalidate and refetch bill payments
      queryClient.invalidateQueries({ queryKey: queryKeys.billPayments(variables.billId) });
    },
  });
};

// Mutation for deleting bill payment
export const useDeleteBillPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { paymentId: number; billId: number }>({
    mutationFn: ({ paymentId }) => deleteBillPayment(paymentId),
    onSuccess: (_, variables) => {
      // Invalidate and refetch bill payments
      queryClient.invalidateQueries({ queryKey: queryKeys.billPayments(variables.billId) });
    },
  });
}; 
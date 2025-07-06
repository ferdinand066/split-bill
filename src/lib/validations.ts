import { z } from 'zod';
import { BillType } from './database';

export const createBillSchema = z.object({
  name: z
    .string()
    .min(1, 'Bill name is required')
    .max(100, 'Bill name must be less than 100 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password must be less than 100 characters'),
  subjects: z
    .array(z.string().min(1, 'Subject name is required').max(50, 'Subject name must be less than 50 characters'))
    .min(1, 'At least one subject is required')
    .max(10, 'Maximum 10 subjects allowed'),
});

export type CreateBillFormData = z.infer<typeof createBillSchema>;

export const addBillInformationSchema = z.object({
  name: z
    .string()
    .min(1, 'Item name is required')
    .max(100, 'Item name must be less than 100 characters'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  paidBy: z
    .number()
    .min(1, 'Please select who paid for this item'),
  billType: z
    .nativeEnum(BillType),
  chargedUsers: z
    .array(z.object({
      userId: z.number().min(1, 'Please select a user'),
      amount: z.string().min(1, 'Amount is required')
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
          message: 'Amount must be a non-negative number',
        }),
    }))
    .min(1, 'At least one person must be charged')
    .refine((data) => {
      const totalCharged = data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      return totalCharged > 0;
    }, {
      message: 'Total charged amount must be greater than 0',
    }),
}).refine((data) => {
  const totalAmount = parseFloat(data.amount);
  const totalCharged = data.chargedUsers.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  return Math.abs(totalAmount - totalCharged) < 0.01; // Allow small floating point differences
}, {
  message: 'Total charged amount must equal the total amount',
  path: ['chargedUsers'],
});

export type AddBillInformationFormData = z.infer<typeof addBillInformationSchema>;

export const createPaymentSchema = z.object({
  payFromId: z
    .number()
    .min(1, 'Please select who is paying'),
  payToId: z
    .number()
    .min(1, 'Please select who is receiving'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    }),
}).refine((data) => data.payFromId !== data.payToId, {
  message: 'Cannot pay to yourself',
  path: ['payToId'],
});

export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;

export const joinBillSchema = z.object({
  billId: z
    .string()
    .min(1, 'Bill ID is required')
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
      message: 'Please enter a valid bill ID (positive number)',
    }),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password must be less than 100 characters'),
});

export const joinBillIdSchema = z.object({
  billId: z
    .string()
    .min(1, 'Bill ID is required')
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
      message: 'Please enter a valid bill ID (positive number)',
    }),
});

export type JoinBillIdFormData = z.infer<typeof joinBillIdSchema>;

export type JoinBillFormData = z.infer<typeof joinBillSchema>; 
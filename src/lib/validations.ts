import { z } from 'zod';
import { BillType } from './database';

export const createBillSchema = z.object({
  name: z
    .string()
    .min(1, 'Bill name is required')
    .max(100, 'Bill name must be less than 100 characters'),
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
});

export type AddBillInformationFormData = z.infer<typeof addBillInformationSchema>; 
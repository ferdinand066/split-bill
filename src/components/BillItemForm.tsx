import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BillType } from '@/lib/database';
import { formatCurrency, formatWithDots, parseDotsFormatted } from '@/lib/utils';
import { addBillInformationSchema, type AddBillInformationFormData } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Split, X } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';

interface BillItemFormProps {
  mode: 'create' | 'edit';
  billName?: string;
  subjects: Array<{
    id: number;
    name: string;
  }>;
  initialData?: {
    name: string;
    amount: string;
    paidBy: number;
    billType: BillType;
    chargedUsers: Array<{
      userId: number;
      amount: string;
    }>;
  };
  onSubmit: (data: AddBillInformationFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  isDeleting?: boolean;
  error?: string | null;
  submitButtonText?: string;
  loadingButtonText?: string;
}

export const BillItemForm = ({
  mode,
  billName,
  subjects,
  initialData,
  onSubmit,
  onCancel,
  onDelete,
  isLoading = false,
  isDeleting = false,
  error = null,
  submitButtonText,
  loadingButtonText,
}: BillItemFormProps) => {
  const sortedSubjects = subjects.sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));

  const form = useForm<AddBillInformationFormData>({
    resolver: zodResolver(addBillInformationSchema),
    defaultValues: initialData || {
      name: '',
      amount: '',
      paidBy: 0,
      billType: BillType.Others,
      chargedUsers: [{ userId: 0, amount: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'chargedUsers',
  });

  const handleSubmit = async (data: AddBillInformationFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting bill item:', error);
    }
  };

  const addChargedUser = () => {
    append({ userId: 0, amount: '' });
  };

  const removeChargedUser = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const splitEqually = () => {
    const totalAmount = parseFloat(form.getValues('amount')) || 0;
    const chargedUsers = form.getValues('chargedUsers');
    
    // Calculate total already assigned
    const assignedAmount = chargedUsers.reduce((sum, user) => {
      return sum + (parseFloat(user.amount) || 0);
    }, 0);
    
    // Calculate remaining amount
    const remainingAmount = totalAmount - assignedAmount;
    
    if (remainingAmount <= 0) {
      return; // No remaining amount to split
    }
    
    // Find users without amounts assigned
    const unassignedUsers = chargedUsers.filter(user => 
      !user.amount || parseFloat(user.amount) === 0
    );
    
    if (unassignedUsers.length === 0) {
      return; // No unassigned users
    }
    
    // Calculate equal split
    const equalAmount = remainingAmount / unassignedUsers.length;
    
    // Update form with equal amounts
    const updatedChargedUsers = chargedUsers.map(user => {
      if (!user.amount || parseFloat(user.amount) === 0) {
        return { ...user, amount: equalAmount.toFixed(0) };
      }
      return user;
    });
    
    form.setValue('chargedUsers', updatedChargedUsers);
  };

  const totalAmount = form.watch('amount');
  const chargedUsers = form.watch('chargedUsers');
  const totalCharged = chargedUsers.reduce((sum, user) => {
    const amount = parseFloat(user.amount) || 0;
    return sum + amount;
  }, 0);

  const remainingAmount = (parseFloat(totalAmount) || 0) - totalCharged;
  const unassignedUsers = chargedUsers.filter(user => 
    !user.amount || parseFloat(user.amount) === 0
  );
  
  // Check if amounts match (with small tolerance for floating point)
  const amountsMatch = Math.abs(remainingAmount) < 0.01;
  const hasValidAmounts = parseFloat(totalAmount) > 0 && amountsMatch;

  const defaultSubmitText = mode === 'create' ? 'Add Item' : 'Update Item';
  const defaultLoadingText = mode === 'create' ? 'Adding...' : 'Updating...';

  return (
    <div className="space-y-6">
      {billName && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {mode === 'create' ? 'Add Bill Item' : 'Edit Bill Item'}
          </h1>
          <p className="text-gray-600">
            {mode === 'create' ? 'Adding item to:' : 'Editing item in:'} <span className="font-semibold">{billName}</span>
          </p>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Item Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Pizza, Drinks, etc."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0"
                    type="text"
                    inputMode="numeric"
                    value={formatWithDots(field.value)}
                    onChange={e => {
                      // Only allow numbers and dots
                      const raw = parseDotsFormatted(e.target.value.replace(/[^\d.]/g, ''));
                      field.onChange(raw);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4'>
            {/* Bill Type */}
            <FormField
              control={form.control}
              name="billType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill Type</FormLabel>
                  <Select onValueChange={(value: string) => field.onChange(parseInt(value))} value={field.value.toString()}>
                    <FormControl className='w-full'>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bill type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={BillType.Others.toString()}>Others</SelectItem>
                      <SelectItem value={BillType.Transportation.toString()}>Transportation</SelectItem>
                      <SelectItem value={BillType.Food.toString()}>Food</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Paid By */}
            <FormField
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid By</FormLabel>
                  <Select onValueChange={(value: string) => field.onChange(parseInt(value))} value={field.value.toString()}>
                    <FormControl className='w-full'>
                      <SelectTrigger>
                        <SelectValue placeholder="Select who paid" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sortedSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Charged Users */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Charged Users</FormLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={splitEqually}
                  disabled={unassignedUsers.length === 0 || remainingAmount <= 0}
                >
                  <Split className="w-4 h-4 mr-1" />
                  Split Equally
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChargedUser}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add User
                </Button>
              </div>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-x-4 gap-y-6 items-end">
                <FormField
                  control={form.control}
                  name={`chargedUsers.${index}.userId`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-sm">User</FormLabel>
                      <Select onValueChange={(value: string) => field.onChange(parseInt(value))} value={field.value.toString()}>
                        <FormControl className='w-full'>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sortedSubjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id.toString()}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`chargedUsers.${index}.amount`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-sm">Amount</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0"
                          type="text"
                          inputMode="numeric"
                          value={formatWithDots(field.value)}
                          onChange={e => {
                            const raw = parseDotsFormatted(e.target.value.replace(/[^\d.]/g, ''));
                            field.onChange(raw);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeChargedUser(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Amount:</span>
              <span className="font-semibold">{formatCurrency(parseFloat(totalAmount) || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Charged:</span>
              <span className="font-semibold">{formatCurrency(totalCharged)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Remaining:</span>
              <span className={`font-semibold ${amountsMatch ? 'text-green-600' : remainingAmount > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                {formatCurrency(remainingAmount)}
              </span>
            </div>
            {amountsMatch ? (
              <div className="text-xs text-green-600 font-medium">
                ✓ Amounts match perfectly!
              </div>
            ) : remainingAmount > 0 ? (
              <div className="text-xs text-orange-600">
                {unassignedUsers.length} user(s) without amounts assigned
              </div>
            ) : (
              <div className="text-xs text-red-600">
                Total charged exceeds total amount by {formatCurrency(Math.abs(remainingAmount))}
              </div>
            )}
          </div>

                      {/* Submit Buttons */}
            <div className="flex justify-between items-center gap-4">
              {mode === 'edit' && onDelete && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || !hasValidAmounts}
                >
                  {isLoading ? (loadingButtonText || defaultLoadingText) : (submitButtonText || defaultSubmitText)}
                </Button>
              </div>
            </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}; 
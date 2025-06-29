import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addBillInformationSchema, type AddBillInformationFormData } from '@/lib/validations';
import { useBill, useBillSubjects } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';
import { Plus, X, Split } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBillInformationHeader, createBillInformationDetails, BillType } from '@/lib/database';

const AddBillItemPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: bill, isLoading: billLoading, error: billError } = useBill(slug || '');
  const { data: subjects = [], isLoading: subjectsLoading } = useBillSubjects(bill?.id || 0);

  const form = useForm<AddBillInformationFormData>({
    resolver: zodResolver(addBillInformationSchema),
    defaultValues: {
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

  const isLoading = billLoading || subjectsLoading;

  const addBillItemMutation = useMutation({
    mutationFn: async (data: AddBillInformationFormData) => {
      const billId = bill?.id || 0;
      const totalAmount = parseFloat(data.amount);
      
      // Create the bill information header
      const header = await createBillInformationHeader(
        billId,
        data.name,
        data.paidBy,
        totalAmount,
        data.billType
      );

      // Create bill information details for each charged user
      const details = data.chargedUsers.map((user) => ({
        chargedUserId: user.userId,
        amount: parseFloat(user.amount)
      }));

      await createBillInformationDetails(header.id, details);
      return header;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill', Number(slug)] });
      queryClient.invalidateQueries({ queryKey: ['billInformationHeaders', Number(slug)] });
      queryClient.invalidateQueries({ queryKey: ['billInformationDetails', Number(slug)] });
      navigate(`/${slug}`);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bill details...</p>
        </div>
      </div>
    );
  }

  if (billError || !bill) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">
            {billError?.message || 'Bill not found'}
          </p>
          <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: AddBillInformationFormData) => {
    try {
      await addBillItemMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error adding bill item:', error);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Add Bill Item
          </h1>
          <p className="text-gray-600">
            Adding item to: <span className="font-semibold">{bill.name}</span>
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      type="number"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bill Type */}
            <FormField
              control={form.control}
              name="billType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill Type</FormLabel>
                  <Select onValueChange={(value: string) => field.onChange(parseInt(value))} value={field.value.toString()}>
                    <FormControl>
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
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select who paid" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((subject) => (
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
                <div key={field.id} className="flex gap-2 items-end">
                  <FormField
                    control={form.control}
                    name={`chargedUsers.${index}.userId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-sm">User</FormLabel>
                        <Select onValueChange={(value: string) => field.onChange(parseInt(value))} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map((subject) => (
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
                            type="number"
                            step="0.01"
                            {...field}
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
                      size="sm"
                      onClick={() => removeChargedUser(index)}
                      className="mb-2"
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
                <span className={`font-semibold ${remainingAmount === 0 ? 'text-green-600' : remainingAmount > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
              {unassignedUsers.length > 0 && remainingAmount > 0 && (
                <div className="text-xs text-gray-500">
                  {unassignedUsers.length} user(s) without amounts assigned
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={addBillItemMutation.isPending}
              >
                {addBillItemMutation.isPending ? 'Adding...' : 'Add Item'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(`/${slug}`)}
              >
                Cancel
              </Button>
            </div>

            {addBillItemMutation.isError && (
              <div className="text-red-600 text-sm text-center">
                Failed to add bill item. Please try again.
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AddBillItemPage; 
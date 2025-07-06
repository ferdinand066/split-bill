import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatWithDots, parseDotsFormatted } from '@/lib/utils';
import { createPaymentSchema, type CreatePaymentFormData } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

interface PaymentFormProps {
  mode: 'create' | 'edit';
  subjects: Array<{
    id: number;
    name: string;
  }>;
  initialData?: {
    payFromId: number;
    payToId: number;
    amount: string;
  };
  onSubmit: (data: CreatePaymentFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  isDeleting?: boolean;
  error?: string | null;
  submitButtonText?: string;
  loadingButtonText?: string;
}

export const PaymentForm = ({
  mode,
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
}: PaymentFormProps) => {
  const sortedSubjects = subjects.sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));

  const form = useForm<CreatePaymentFormData>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: initialData || {
      payFromId: 0,
      payToId: 0,
      amount: '',
    },
  });

  const handleSubmit = async (data: CreatePaymentFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting payment:', error);
    }
  };

  const defaultSubmitText = mode === 'create' ? 'Add Payment' : 'Update Payment';
  const defaultLoadingText = mode === 'create' ? 'Adding...' : 'Updating...';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 items-start'>
          <FormField
            control={form.control}
            name="payFromId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paid From</FormLabel>
                <Select onValueChange={(value: string) => field.onChange(parseInt(value))} value={field.value.toString()}>
                  <FormControl className='w-full'>
                    <SelectTrigger>
                      <SelectValue placeholder="Select who is paying" />
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
            name="payToId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paid To</FormLabel>
                <Select onValueChange={(value: string) => field.onChange(parseInt(value))} value={field.value.toString()}>
                  <FormControl className='w-full'>
                    <SelectTrigger>
                      <SelectValue placeholder="Select who is receiving" />
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

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter amount"
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

        <div className="flex justify-between items-center gap-4 pt-4">
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
              disabled={isLoading}
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
  );
}; 
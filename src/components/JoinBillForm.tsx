import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { joinBillIdSchema, type JoinBillIdFormData } from '@/lib/validations';
import { AlertCircle, Search } from 'lucide-react';

interface JoinBillFormProps {
  onSubmit: (data: JoinBillIdFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const JoinBillForm = ({ onSubmit, isLoading = false, error = null }: JoinBillFormProps) => {
  const form = useForm<JoinBillIdFormData>({
    resolver: zodResolver(joinBillIdSchema),
    defaultValues: {
      billId: '',
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent arrow up/down from incrementing/decrementing the number
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      return;
    }
    
    if (e.key === 'Enter') {
      handleFormSubmit();
    }
  };

  const handleFormSubmit = form.handleSubmit(onSubmit);

  const billIdValue = form.watch('billId');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Join Existing Bill
      </h2>
      <p className="text-gray-600 mb-2 sm:mb-4">
        Have a bill ID? Enter it below to join an existing bill.
      </p>
      
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <FormField
              control={form.control}
              name="billId"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter bill ID..."
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit"
              variant="outline" 
              disabled={isLoading || !billIdValue}
              className="flex items-center gap-2"

            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Join
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}; 
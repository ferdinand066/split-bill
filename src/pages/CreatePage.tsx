import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createBillSchema, type CreateBillFormData } from '@/lib/validations';
import { useCreateBill } from '@/lib/queries';
import { Plus, X } from 'lucide-react';

const CreatePage = () => {
  const navigate = useNavigate();
  const createBillMutation = useCreateBill();

  const form = useForm<CreateBillFormData>({
    resolver: zodResolver(createBillSchema),
    defaultValues: {
      name: '',
      subjects: [''],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'subjects' as never,
  });

  const onSubmit = async (data: CreateBillFormData) => {
    try {
      const result = await createBillMutation.mutateAsync({
        name: data.name,
        subjects: data.subjects.filter(subject => subject.trim() !== ''),
      });
      
      // Navigate to the bill detail page
      navigate(`/${result.bill.slug}`);
    } catch (error) {
      console.error('Error creating bill:', error);
      // The mutation will handle the error display
    }
  };

  const addSubject = () => {
    if (fields.length < 10) {
      append('');
    }
  };

  const removeSubject = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create New Bill
        </h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Dinner at Restaurant"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-3">
              <FormLabel>Participants</FormLabel>
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`subjects.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder={`Participant ${index + 1}`}
                            {...field}
                          />
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeSubject(index)}
                              className="shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              
              {fields.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSubject}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Participant
                </Button>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={createBillMutation.isPending}
            >
              {createBillMutation.isPending ? 'Creating...' : 'Create Bill'}
            </Button>
            
            {createBillMutation.isError && (
              <div className="text-red-600 text-sm text-center">
                Failed to create bill. Please try again.
              </div>
            )}
          </form>
        </Form>
        
        <div className="mt-6 text-center">
          <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreatePage; 
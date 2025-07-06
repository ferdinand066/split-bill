import { BillItemForm } from '@/components/BillItemForm';
import { createBillInformationDetails, createBillInformationHeader } from '@/lib/database';
import { queryKeys, useBill, useBillSubjects } from '@/lib/queries';
import { type AddBillInformationFormData } from '@/lib/validations';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';

const AddBillItemPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: bill, isLoading: billLoading, error: billError } = useBill(slug || '');
  const { data: subjects = [], isLoading: subjectsLoading } = useBillSubjects(bill?.id || 0);

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
      queryClient.invalidateQueries({ queryKey: queryKeys.bill(slug || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.billById(bill?.id || 0) });
      queryClient.invalidateQueries({ queryKey: queryKeys.billInformationHeaders(bill?.id || 0) });
      queryClient.invalidateQueries({ queryKey: queryKeys.billInformationDetailByBillId(bill?.id || 0) });
      navigate(`/${slug}`);
    },
  });

  const isLoading = billLoading || subjectsLoading;

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

  const handleSubmit = async (data: AddBillInformationFormData) => {
    await addBillItemMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    navigate(`/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <BillItemForm
          mode="create"
          billName={bill.name}
          subjects={subjects}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={addBillItemMutation.isPending}
          error={addBillItemMutation.isError ? 'Failed to add bill item. Please try again.' : null}
        />
      </div>
    </div>
  );
};

export default AddBillItemPage; 
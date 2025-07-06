import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PaymentForm } from '@/components/PaymentForm';
import type { BillPaymentWithParticipants } from '@/lib/database';
import { useDeleteBillPayment, useUpdateBillPayment } from '@/lib/queries';
import { type CreatePaymentFormData } from '@/lib/validations';
import { useState } from 'react';

interface EditPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payment: BillPaymentWithParticipants;
  subjects: Array<{
    id: number;
    name: string;
  }>;
  billId: number;
}

export const EditPaymentDialog = ({
  isOpen,
  onClose,
  payment,
  subjects,
  billId,
}: EditPaymentDialogProps) => {
  const updatePaymentMutation = useUpdateBillPayment();
  const deletePaymentMutation = useDeleteBillPayment();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const handleSubmit = async (data: CreatePaymentFormData) => {
    await updatePaymentMutation.mutateAsync({
      paymentId: payment.id,
      billId,
      payFromId: data.payFromId,
      payToId: data.payToId,
      amount: parseFloat(data.amount),
    });
    
    onClose();
  };

  const handleDelete = () => {
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deletePaymentMutation.mutateAsync({
        paymentId: payment.id,
        billId,
      });
      
      setIsDeleteAlertOpen(false);
      onClose();
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const initialData = {
    payFromId: payment.pay_from_id,
    payToId: payment.pay_to_id,
    amount: payment.amount.toString(),
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          
          <PaymentForm
            mode="edit"
            subjects={subjects}
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={onClose}
            onDelete={handleDelete}
            isLoading={updatePaymentMutation.isPending}
            isDeleting={deletePaymentMutation.isPending}
            error={updatePaymentMutation.isError ? 'Failed to update payment. Please try again.' : null}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePaymentMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletePaymentMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 
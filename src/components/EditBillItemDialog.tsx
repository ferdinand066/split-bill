import { BillItemForm } from '@/components/BillItemForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BillType } from '@/lib/database';
import { useDeleteBillInformation, useUpdateBillInformation } from '@/lib/queries';
import { type AddBillInformationFormData } from '@/lib/validations';
import { useState } from 'react';

interface EditBillItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  header: {
    id: number;
    name: string;
    amount: number;
    bill_type: BillType;
    paid_by_id: number;
  };
  details: Array<{
    id: number;
    charged_user_id: number;
    amount: number;
  }>;
  subjects: Array<{
    id: number;
    name: string;
  }>;
  billId: number;
}

export const EditBillItemDialog = ({
  isOpen,
  onClose,
  header,
  details,
  subjects,
  billId,
}: EditBillItemDialogProps) => {
  const updateBillItemMutation = useUpdateBillInformation();
  const deleteBillItemMutation = useDeleteBillInformation();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const handleSubmit = async (data: AddBillInformationFormData) => {
    await updateBillItemMutation.mutateAsync({
      headerId: header.id,
      billId,
      name: data.name,
      paidById: data.paidBy,
      amount: parseFloat(data.amount),
      billType: data.billType,
      chargedUsers: data.chargedUsers.map(user => ({
        userId: user.userId,
        amount: parseFloat(user.amount),
      })),
    });
    
    onClose();
  };

  const handleDelete = () => {
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteBillItemMutation.mutateAsync({
        headerId: header.id,
        billId,
      });
      
      setIsDeleteAlertOpen(false);
      onClose();
    } catch (error) {
      console.error('Error deleting bill item:', error);
    }
  };

  const initialData = {
    name: header.name,
    amount: header.amount.toString(),
    paidBy: header.paid_by_id,
    billType: header.bill_type,
    chargedUsers: details.map(detail => ({
      userId: detail.charged_user_id,
      amount: detail.amount.toString(),
    })),
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bill Item</DialogTitle>
          </DialogHeader>
        
          <BillItemForm
            mode="edit"
            subjects={subjects}
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={onClose}
            onDelete={handleDelete}
            isLoading={updateBillItemMutation.isPending}
            isDeleting={deleteBillItemMutation.isPending}
            error={updateBillItemMutation.isError ? 'Failed to update bill item. Please try again.' : null}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{header.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteBillItemMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteBillItemMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 
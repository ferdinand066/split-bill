import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBillHistoryStore, usePasswordVerificationStore } from '@/lib/store';
import { hashPassword } from '@/lib/utils';
import { joinBillIdSchema, type JoinBillIdFormData } from '@/lib/validations';

export const useIndexPage = () => {
  const navigate = useNavigate();
  const { bills, removeBill, clearHistory, addBill } = useBillHistoryStore();
  const { markBillAsVerified } = usePasswordVerificationStore();
  
  // Form for joining bills
  const joinForm = useForm<JoinBillIdFormData>({
    resolver: zodResolver(joinBillIdSchema),
    defaultValues: {
      billId: '',
    },
  });

  // States
  const [isSearching, setIsSearching] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; billSlug: string | null }>({
    isOpen: false,
    billSlug: null
  });
  const [clearHistoryConfirmation, setClearHistoryConfirmation] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  // Bill removal handlers
  const handleRemoveBill = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmation({ isOpen: true, billSlug: slug });
  };

  const confirmDeleteBill = () => {
    if (deleteConfirmation.billSlug) {
      removeBill(deleteConfirmation.billSlug);
      setDeleteConfirmation({ isOpen: false, billSlug: null });
    }
  };

  // Clear history handlers
  const handleClearHistory = () => {
    setClearHistoryConfirmation(true);
  };

  const confirmClearHistory = () => {
    clearHistory();
    setClearHistoryConfirmation(false);
  };

  // Join bill handlers
  const handleJoinBill = async (data: JoinBillIdFormData) => {
    setIsSearching(true);
    setPasswordError('');

    try {
      // Check if bill exists first
      const { getBillById } = await import('@/lib/database');
      await getBillById(parseInt(data.billId));
      
      // Bill exists, show password dialog
      setSelectedBillId(data.billId);
      setShowPasswordDialog(true);
    } catch (error) {
      setPasswordError('Bill not found. Please check the ID and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleVerifyPassword = async (password: string) => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }
    setIsVerifyingPassword(true);
    setPasswordError('');
    try {
      const billId = parseInt(selectedBillId ?? '');
      const hashedPassword = await hashPassword(password);
      const { verifyBillPassword, getBillById } = await import('@/lib/database');
      const isValid = await verifyBillPassword(billId, hashedPassword);
      if (isValid) {
        const bill = await getBillById(billId);
        addBill(bill);
        markBillAsVerified(bill.slug);
        navigate(`/${bill.slug}`);
        setShowPasswordDialog(false);
        setSelectedBillId(null);
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    } catch (error) {
      setPasswordError('An error occurred. Please try again.');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent, password: string) => {
    if (e.key === 'Enter') {
      handleVerifyPassword(password);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent arrow up/down from incrementing/decrementing the number
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      return;
    }
    
    if (e.key === 'Enter') {
      joinForm.handleSubmit(handleJoinBill)();
    }
  };

  const closePasswordDialog = (resetPassword?: () => void) => {
    setShowPasswordDialog(false);
    joinForm.reset();
    setPasswordError('');
    if (resetPassword) {
      resetPassword();
    }
  };

  return {
    // State
    bills,
    isSearching,
    showPasswordDialog,
    passwordError,
    isVerifyingPassword,
    deleteConfirmation,
    clearHistoryConfirmation,
    
    // Form
    joinForm,
    
    // Handlers
    handleRemoveBill,
    confirmDeleteBill,
    handleClearHistory,
    confirmClearHistory,
    handleJoinBill,
    handleVerifyPassword,
    handlePasswordKeyDown,
    handleKeyDown,
    closePasswordDialog,
    
    // Setters
    setDeleteConfirmation,
    setClearHistoryConfirmation,
  };
}; 
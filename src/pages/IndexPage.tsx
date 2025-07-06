import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

import { RecentBills } from '@/components/RecentBills';
import { JoinBillForm } from '@/components/JoinBillForm';
import { useIndexPage } from '@/hooks/useIndexPage';
import { AlertCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const IndexPage = () => {
  const {
    // State
    isSearching,
    showPasswordDialog,
    passwordError,
    isVerifyingPassword,
    deleteConfirmation,
    clearHistoryConfirmation,
    

    
    // Handlers
    handleRemoveBill,
    confirmDeleteBill,
    handleClearHistory,
    confirmClearHistory,
    handleJoinBill,
    handleVerifyPassword,
    handlePasswordKeyDown,
    closePasswordDialog,
    
    // Setters
    setDeleteConfirmation,
    setClearHistoryConfirmation,
  } = useIndexPage();

  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Split Bill App
          </h1>
          <p className="text-gray-600 text-lg">
            Easily split bills and expenses with friends and family
          </p>
        </div>

        {/* Create New Bill Button */}
        <div className="mb-8">
          <Button asChild className="w-full sm:w-auto" size="lg">
            <Link to="/create" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Bill
            </Link>
          </Button>
        </div>

        {/* Recent Bills */}
        <RecentBills 
          onRemoveBill={handleRemoveBill}
          onClearHistory={handleClearHistory}
        />

        {/* Join Existing Bill */}
        <JoinBillForm
          onSubmit={handleJoinBill}
          isLoading={isSearching}
          error={passwordError}
        />
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={(open) => {
        if (!open) {
          closePasswordDialog(() => setPassword(''));
        }
      }}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Enter Bill Password</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyPassword(password);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete='new-password'
                placeholder="Enter the bill password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => handlePasswordKeyDown(e, password)}
                disabled={isVerifyingPassword}
                className="w-full"
              />
            </div>
            {passwordError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {passwordError}
              </div>
            )}
            <DialogFooter className='gap-y-2'>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  closePasswordDialog();
                  setPassword('');
                }}
                disabled={isVerifyingPassword}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isVerifyingPassword || !password.trim()}
              >
                {isVerifyingPassword ? 'Verifying...' : 'Join Bill'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(open) => setDeleteConfirmation({ isOpen: open, billSlug: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Bill from History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this bill from your history? This action cannot be undone and will not delete the actual bill.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBill}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear History Confirmation Dialog */}
      <AlertDialog open={clearHistoryConfirmation} onOpenChange={setClearHistoryConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Bill History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all bill history? This will remove all bills from your recent bills list. This action cannot be undone and will not delete the actual bills.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearHistory}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default IndexPage; 
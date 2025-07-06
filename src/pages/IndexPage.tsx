import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useBillHistoryStore, usePasswordVerificationStore } from '@/lib/store';
import { capitalizeFirstLetter, hashPassword } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const IndexPage = () => {
  const navigate = useNavigate();
  const { bills, removeBill, clearHistory, addBill } = useBillHistoryStore();
  const { markBillAsVerified } = usePasswordVerificationStore();
  const [billId, setBillId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const handleRemoveBill = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeBill(slug);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all bill history?')) {
      clearHistory();
    }
  };

  const handleJoinBill = async () => {
    const id = parseInt(billId.trim());
    if (!id || isNaN(id)) {
      setSearchError('Please enter a valid bill ID (number)');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      // Check if bill exists first
      const { getBillById } = await import('@/lib/database');
      await getBillById(id);
      
      // Bill exists, show password dialog
      setShowPasswordDialog(true);
    } catch (error) {
      setSearchError('Bill not found. Please check the ID and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent arrow up/down from incrementing/decrementing the number
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      return;
    }
    
    if (e.key === 'Enter') {
      handleJoinBill();
    }
  };

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }

    setIsVerifyingPassword(true);
    setPasswordError('');

    try {
      const id = parseInt(billId.trim());
      const hashedPassword = await hashPassword(password);
      
      const { verifyBillPassword, getBillById } = await import('@/lib/database');
      const isValid = await verifyBillPassword(id, hashedPassword);
      
      if (isValid) {
        // Password is correct, get bill and navigate
        const bill = await getBillById(id);
        addBill(bill);
        markBillAsVerified(bill.slug);
        navigate(`/${bill.slug}`);
        setShowPasswordDialog(false);
        setPassword('');
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    } catch (error) {
      setPasswordError('An error occurred. Please try again.');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerifyPassword();
    }
  };

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
        {bills.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Recent Bills
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear History
              </Button>
            </div>
            <div className="space-y-3">
              {bills.map((bill) => (
                <Link
                  key={bill.slug}
                  to={`/${bill.slug}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                        {bill.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {capitalizeFirstLetter(formatDistanceToNow(new Date(bill.created_at), { addSuffix: true }))}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleRemoveBill(e, bill.slug)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Join Existing Bill */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Join Existing Bill
          </h2>
          <p className="text-gray-600 mb-4">
            Have a bill ID? Enter it below to join an existing bill.
          </p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Enter bill ID..."
                value={billId}
                onChange={(e) => setBillId(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 h-9 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled={isSearching}
              />
              <Button 
                variant="outline" 
                onClick={handleJoinBill}
                disabled={isSearching || !billId.trim()}
                className="flex items-center gap-2"
              >
                {isSearching ? (
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
            {searchError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {searchError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Enter Bill Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter the bill password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
                className="w-full"
                disabled={isVerifyingPassword}
              />
            </div>
            {passwordError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {passwordError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setPassword('');
                setPasswordError('');
              }}
              disabled={isVerifyingPassword}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyPassword}
              disabled={isVerifyingPassword || !password.trim()}
            >
              {isVerifyingPassword ? 'Verifying...' : 'Join Bill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IndexPage; 
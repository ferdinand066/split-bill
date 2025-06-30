import { Button } from '@/components/ui/button';
import { useBillHistoryStore } from '@/lib/store';
import { capitalizeFirstLetter } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const IndexPage = () => {
  const navigate = useNavigate();
  const { bills, removeBill, clearHistory, addBill } = useBillHistoryStore();
  const [billId, setBillId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

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
      // Use the getBillById function directly
      const { getBillById } = await import('@/lib/database');
      const bill = await getBillById(id);
      
      // Add to history and navigate
      addBill(bill);
      navigate(`/${bill.slug}`);
    } catch (error) {
      setSearchError('Bill not found. Please check the ID and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinBill();
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
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
    </div>
  );
};

export default IndexPage; 
import { Button } from '@/components/ui/button';
import { useBillHistoryStore } from '@/lib/store';
import { capitalizeFirstLetter } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentBillsProps {
  onRemoveBill: (e: React.MouseEvent, slug: string) => void;
  onClearHistory: () => void;
}

export const RecentBills = ({ onRemoveBill, onClearHistory }: RecentBillsProps) => {
  const { bills } = useBillHistoryStore();

  if (bills.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Recent Bills
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearHistory}
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
                onClick={(e) => onRemoveBill(e, bill.slug)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}; 
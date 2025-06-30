import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBill, useBillSubjects, useBillInformationHeaders, useBillInformationDetailByBillId } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';
import { BillType } from '@/lib/database';
import { useState } from 'react';

export default function DetailPage() {
  const { slug } = useParams();
  const [selectedBillType, setSelectedBillType] = useState<string>('all');

  const { data: bill, isLoading: billLoading, error: billError } = useBill(slug || '');
  const { data: subjects = [], isLoading: subjectsLoading } = useBillSubjects(bill?.id || 0);
  const { data: headers = [], isLoading: headersLoading } = useBillInformationHeaders(bill?.id || 0);
  const { data: details = [], isLoading: detailsLoading } = useBillInformationDetailByBillId(bill?.id || 0);

  const isLoading = billLoading || subjectsLoading || headersLoading || detailsLoading;

  // Filter headers by selected bill type
  const filteredHeaders = selectedBillType === 'all' 
    ? headers 
    : headers.filter(header => header.bill_type === parseInt(selectedBillType));

  // Calculate participant summary
  const participantSummary = subjects.map(subject => {
    const paidAmount = headers
      .filter(header => header.paid_by_id === subject.id)
      .reduce((sum, header) => sum + header.amount, 0);

    const chargedAmount = details
      .filter(detail => detail.charged_user_id === subject.id)
      .reduce((sum, detail) => sum + detail.amount, 0);

    const balance = paidAmount - chargedAmount;

    return {
      ...subject,
      paidAmount,
      chargedAmount,
      balance
    };
  });

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

  const getBillTypeLabel = (billType: BillType) => {
    switch (billType) {
      case BillType.Transportation:
        return 'Transportation';
      case BillType.Food:
        return 'Food';
      case BillType.Others:
      default:
        return 'Others';
    }
  };

  const getBillTypeColor = (billType: BillType) => {
    switch (billType) {
      case BillType.Transportation:
        return 'bg-blue-100 text-blue-800';
      case BillType.Food:
        return 'bg-green-100 text-green-800';
      case BillType.Others:
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{bill.name}</h1>
              <p className="text-gray-600 mt-1">
                {subjects.length} participants • {headers.length} items
              </p>
            </div>
            <Link to={`/${slug}/add`} className="ml-auto sm:w-fit">
              <Button>Add Bill Item</Button>
            </Link>
          </div>

          {/* Bill Type Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-fit">
              <label className="text-sm font-medium text-gray-700">Filter by type:</label>
              <Select value={selectedBillType} onValueChange={setSelectedBillType}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={BillType.Transportation.toString()}>Transportation</SelectItem>
                  <SelectItem value={BillType.Food.toString()}>Food</SelectItem>
                  <SelectItem value={BillType.Others.toString()}>Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Grand Total */}
            <div className="flex flex-col items-start sm:items-end">
              <p className="text-sm text-gray-600">Grand Total</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">
                {formatCurrency(filteredHeaders.reduce((sum, header) => sum + header.amount, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items">Bill Items ({filteredHeaders.length})</TabsTrigger>
            <TabsTrigger value="summary">Participant Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            {filteredHeaders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">
                  {selectedBillType === 'all' 
                    ? 'No bill items yet. Add your first item!' 
                    : 'No items found for the selected type.'}
                </p>
                {selectedBillType !== 'all' && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSelectedBillType('all')}
                  >
                    Show All Types
                  </Button>
                )}
              </div>
            ) : (
              filteredHeaders.map((header) => {
                const headerDetails = details.filter(detail => 
                  detail.header_id === header.id
                );

                return (
                  <div key={header.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-x-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-x-3 gap-y-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {header.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBillTypeColor(header.bill_type)} whitespace-nowrap`}>
                            {getBillTypeLabel(header.bill_type)}
                          </span>
                        </div>
                        <p className="text-gray-600">
                          Paid by <span className="font-medium">{header.paid_by.name}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">
                          {formatCurrency(header.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Charged to:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {headerDetails.sort((a, b) => a.charged_user.name.localeCompare(b.charged_user.name)).map((detail) => (
                          <div key={detail.id} className="flex justify-between items-center">
                            <span className="text-gray-600">{detail.charged_user.name}</span>
                            <span className="font-medium">{formatCurrency(detail.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Participant Summary</h2>
              <div className="space-y-4">
                {participantSummary.map((participant) => (
                  <div key={participant.id} className="grid grid-cols-12 p-4 bg-gray-50 rounded-lg gap-4">
                    <div className="col-span-12 sm:col-span-3 inline-flex items-center">
                      <h3 className="font-medium text-gray-800">{participant.name}</h3>
                    </div>
                    <div className="text-center col-span-6 sm:col-span-3">
                        <p className="text-sm text-gray-600 mb-1">Paid</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(participant.paidAmount)}
                        </p>
                      </div>
                      <div className="text-center col-span-6 sm:col-span-3">
                        <p className="text-sm text-gray-600 mb-1">Charged</p>
                        <p className="font-semibold text-red-600">
                          {formatCurrency(participant.chargedAmount)}
                        </p>
                      </div>
                      <div className="text-center col-span-12 sm:col-span-3">
                        <p className="text-sm text-gray-600 mb-1">Balance</p>
                        <p className={`font-semibold ${
                          participant.balance > 0 
                            ? 'text-green-600' 
                            : participant.balance < 0 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                        }`}>
                          {formatCurrency(participant.balance)}
                        </p>
                      </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
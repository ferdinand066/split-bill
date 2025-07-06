import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BillType } from '@/lib/database';
import { useBill, useBillInformationDetailByBillId, useBillInformationHeaders, useBillPayments, useBillSubjects, useCreateBillPayment } from '@/lib/queries';
import { useBillHistoryStore, usePasswordVerificationStore } from '@/lib/store';
import { formatCurrency, hashPassword } from '@/lib/utils';
import { type CreatePaymentFormData } from '@/lib/validations';
import { AlertCircle, ArrowDown, ArrowUp, Plus, ArrowLeft } from 'lucide-react';
import { useEffect, useState, lazy, Suspense } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

// Lazy load dialog components
const EditBillItemDialog = lazy(() => import('@/components/EditBillItemDialog').then(module => ({ default: module.EditBillItemDialog })));
const EditPaymentDialog = lazy(() => import('@/components/EditPaymentDialog').then(module => ({ default: module.EditPaymentDialog })));
const PaymentForm = lazy(() => import('@/components/PaymentForm').then(module => ({ default: module.PaymentForm })));


export default function DetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selectedBillType, setSelectedBillType] = useState<string>('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHeader, setEditingHeader] = useState<any>(null);
  const [isEditPaymentDialogOpen, setIsEditPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const addBill = useBillHistoryStore(state => state.addBill);
  const { isBillVerified, markBillAsVerified } = usePasswordVerificationStore();

  const { data: bill, isLoading: billLoading, error: billError } = useBill(slug || '');
  const { data: subjects = [], isLoading: subjectsLoading } = useBillSubjects(bill?.id || 0);
  const { data: headers = [], isLoading: headersLoading } = useBillInformationHeaders(bill?.id || 0);
  const { data: details = [], isLoading: detailsLoading } = useBillInformationDetailByBillId(bill?.id || 0);
  const { data: payments = [], isLoading: paymentsLoading } = useBillPayments(bill?.id || 0);
  const createPaymentMutation = useCreateBillPayment();

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }

    setIsVerifyingPassword(true);
    setPasswordError('');

    try {
      if (!bill) return;
      
      const hashedPassword = await hashPassword(password);
      
      const { verifyBillPassword } = await import('@/lib/database');
      const isValid = await verifyBillPassword(bill.id, hashedPassword);
      
      if (isValid) {
        markBillAsVerified(bill.slug);
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

  const handleEditBillItem = (header: any) => {
    setEditingHeader(header);
    setIsEditDialogOpen(true);
  };

  const handleEditPayment = (payment: any) => {
    setEditingPayment(payment);
    setIsEditPaymentDialogOpen(true);
  };

  // Add bill to history when it's loaded
  useEffect(() => {
    if (bill) {
      addBill(bill);
    }
  }, [bill, addBill]);

  const isLoading = billLoading || subjectsLoading || headersLoading || detailsLoading || paymentsLoading;

  // Filter headers by selected bill type
  const filteredHeaders = selectedBillType === 'all' 
    ? headers 
    : headers.filter(header => header.bill_type === parseInt(selectedBillType));

  // Calculate participant summary with payments
  const participantSummary = subjects.map(subject => {
    const paidAmount = headers
      .filter(header => header.paid_by_id === subject.id)
      .reduce((sum, header) => sum + header.amount, 0);

    const chargedAmount = details
      .filter(detail => detail.charged_user_id === subject.id)
      .reduce((sum, detail) => sum + detail.amount, 0);

    // Get payments where this person is involved
    const paymentsInvolved = payments.filter(payment => 
      payment.paid_from.id === subject.id || payment.paid_to.id === subject.id
    );

    // Calculate net payments (positive = received, negative = sent)
    const netPayments = paymentsInvolved.reduce((sum, payment) => {
      if (payment.pay_to_id === subject.id) {
        return sum - payment.amount; // Received money
      } else {
        return sum + payment.amount; // Sent money
      }
    }, 0);

    const balance = paidAmount - chargedAmount + netPayments;

    return {
      ...subject,
      paidAmount,
      chargedAmount,
      netPayments,
      balance,
      paymentsInvolved
    };
  });

  const onSubmitPayment = async (data: CreatePaymentFormData) => {
    if (!bill) return;

    try {
      await createPaymentMutation.mutateAsync({
        billId: bill.id,
        payFromId: data.payFromId,
        payToId: data.payToId,
        amount: parseFloat(data.amount),
      });
      
      setIsPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

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

  // Show password dialog overlay if password hasn't been verified
  if (bill && !isBillVerified(bill.slug)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            {bill.name}
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            This bill is password protected
          </p>
          
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                disabled={isVerifyingPassword}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyPassword}
                disabled={isVerifyingPassword || !password.trim()}
                className="flex-1"
              >
                {isVerifyingPassword ? 'Verifying...' : 'Access Bill'}
              </Button>
            </div>
          </div>
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
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bills
          </Button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-y-4">
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
                  <div 
                    key={header.id} 
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                    onClick={() => handleEditBillItem(header)}
                  >
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Participant Summary</h2>
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby={undefined} className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Payment</DialogTitle>
                    </DialogHeader>
                    <Suspense fallback={<div className="p-4 text-center">Loading payment form...</div>}>
                      <PaymentForm
                        mode="create"
                        subjects={subjects}
                        onSubmit={onSubmitPayment}
                        onCancel={() => setIsPaymentDialogOpen(false)}
                        isLoading={createPaymentMutation.isPending}
                        error={createPaymentMutation.isError ? 'Failed to add payment. Please try again.' : null}
                      />
                    </Suspense>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-4">
                {participantSummary.map((participant) => (
                  <div key={participant.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Participant Header */}
                    <div className="grid grid-cols-12 p-4 bg-gray-50 gap-4">
                      <div className="col-span-12 md:col-span-4 inline-flex items-center">
                        <h3 className="font-medium text-gray-800">{participant.name}</h3>
                      </div>
                      <div className="text-center col-span-6 md:col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Paid</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(participant.paidAmount)}
                        </p>
                      </div>
                      <div className="text-center col-span-6 md:col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Charged</p>
                        <p className="font-semibold text-red-600">
                          {formatCurrency(participant.chargedAmount)}
                        </p>
                      </div>
                      <div className="text-center col-span-6 md:col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Net Payments</p>
                        <p className={`font-semibold ${
                          participant.netPayments > 0 
                            ? 'text-green-600' 
                            : participant.netPayments < 0 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                        }`}>
                          {formatCurrency(participant.netPayments)}
                        </p>
                      </div>
                      <div className="text-center col-span-6 md:col-span-2">
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

                    {/* Bill Payments List */}
                    {participant.paymentsInvolved.length > 0 && (
                      <div className="p-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Payment History</h4>
                        <div className="space-y-2">
                          {participant.paymentsInvolved.map((payment) => {
                            const isReceived = payment.pay_to_id === participant.id;
                            const otherPerson = isReceived ? payment.paid_from : payment.paid_to;
                            
                            return (
                              <div 
                                key={payment.id} 
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                                onClick={() => handleEditPayment(payment)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1 rounded-full ${
                                    isReceived 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-red-100 text-red-600'
                                  }`}>
                                    {isReceived ? (
                                      <ArrowDown className="w-4 h-4" />
                                    ) : (
                                      <ArrowUp className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">
                                      {isReceived ? 'Received from' : 'Paid to'} {otherPerson.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(payment.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-semibold ${
                                    isReceived ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {isReceived ? '+' : '-'}{formatCurrency(payment.amount)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* No Payments Message */}
                    {participant.paymentsInvolved.length === 0 && (
                      <div className="p-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500 text-center">
                          No payments recorded yet
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Bill Item Dialog */}
      {editingHeader && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">Loading edit dialog...</div>}>
          <EditBillItemDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setEditingHeader(null);
            }}
            header={editingHeader}
            details={details.filter(detail => detail.header_id === editingHeader.id)}
            subjects={subjects}
            billId={bill?.id || 0}
          />
        </Suspense>
      )}

      {/* Edit Payment Dialog */}
      {editingPayment && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">Loading edit dialog...</div>}>
          <EditPaymentDialog
            isOpen={isEditPaymentDialogOpen}
            onClose={() => {
              setIsEditPaymentDialogOpen(false);
              setEditingPayment(null);
            }}
            payment={editingPayment}
            subjects={subjects}
            billId={bill?.id || 0}
          />
        </Suspense>
      )}
    </div>
  );
} 
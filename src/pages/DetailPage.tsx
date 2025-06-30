import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BillType } from '@/lib/database';
import { useBill, useBillInformationDetailByBillId, useBillInformationHeaders, useBillPayments, useBillSubjects, useCreateBillPayment } from '@/lib/queries';
import { useBillHistoryStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { createPaymentSchema, type CreatePaymentFormData } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';

export default function DetailPage() {
  const { slug } = useParams();
  const [selectedBillType, setSelectedBillType] = useState<string>('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const addBill = useBillHistoryStore(state => state.addBill);

  const { data: bill, isLoading: billLoading, error: billError } = useBill(slug || '');
  const { data: subjects = [], isLoading: subjectsLoading } = useBillSubjects(bill?.id || 0);
  const { data: headers = [], isLoading: headersLoading } = useBillInformationHeaders(bill?.id || 0);
  const { data: details = [], isLoading: detailsLoading } = useBillInformationDetailByBillId(bill?.id || 0);
  const { data: payments = [], isLoading: paymentsLoading } = useBillPayments(bill?.id || 0);
  const createPaymentMutation = useCreateBillPayment();

  const form = useForm<CreatePaymentFormData>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      payFromId: 0,
      payToId: 0,
      amount: '',
    },
  });

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
      
      // Reset form and close dialog
      form.reset();
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Participant Summary</h2>
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Payment</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitPayment)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="payFromId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Paid From</FormLabel>
                              <Select onValueChange={(value: string) => field.onChange(parseInt(value))} value={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select who is paying" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {subjects.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id.toString()}>
                                      {subject.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="payToId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Paid To</FormLabel>
                              <Select onValueChange={(value: string) => field.onChange(parseInt(value))} value={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select who is receiving" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {subjects.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id.toString()}>
                                      {subject.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter amount"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsPaymentDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={createPaymentMutation.isPending}
                          >
                            {createPaymentMutation.isPending ? 'Adding...' : 'Add Payment'}
                          </Button>
                        </div>
                        
                        {createPaymentMutation.isError && (
                          <div className="text-red-600 text-sm text-center">
                            Failed to add payment. Please try again.
                          </div>
                        )}
                      </form>
                    </Form>
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
                              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
    </div>
  );
} 
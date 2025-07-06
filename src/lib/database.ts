import { supabase } from './supabase'

export enum BillType {
  Others = 0,
  Transportation = 1,
  Food = 2,
}

// Types for our data
export interface Bill {
  id: number
  name: string
  slug: string
  password: string
  created_at: string
}

export interface BillSubject {
  id: number
  name: string
  bill_id: Bill['id']
  created_at: string
}

export interface BillInformationHeader {
  id: number
  bill_id: Bill['id']
  name: string
  paid_by_id: BillSubject['id']
  amount: number
  bill_type: BillType
  created_at: string
}

export interface BillInformationDetail {
  id: number
  header_id: BillInformationHeader['id']
  charged_user_id: BillSubject['id']
  amount: number
  created_at: string
}

export interface BillPayment {
  id: number
  bill_id: Bill['id']
  pay_from_id: BillSubject['id']
  pay_to_id: BillSubject['id']
  amount: number
  created_at: string
}

// Extended types for joins
export interface BillInformationHeaderWithPaidBy extends BillInformationHeader {
  paid_by: BillSubject
}

export interface BillInformationDetailWithChargedUser extends BillInformationDetail {
  charged_user: BillSubject
}

export interface BillPaymentWithParticipants extends BillPayment {
  paid_from: BillSubject
  paid_to: BillSubject
}

// Return types for database operations
export interface CreateBillResult {
  bill: Bill
  subjects: BillSubject[]
}

export interface CreateBillInformationResult {
  header: BillInformationHeader
  details: BillInformationDetail[]
}

// Bill operations
export const createBill = async (name: string, password: string, subjects: string[]): Promise<CreateBillResult> => {
  // Start a transaction by creating the bill first
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert([
      {
        name,
        password,
        slug: generateSlug(name)
      }
    ])
    .select()
    .single()

  if (billError) throw billError

  // Then create bill subjects
  const subjectsData = subjects.map(subjectName => ({
    name: subjectName,
    bill_id: bill.id
  }))

  const { data: billSubjects, error: subjectsError } = await supabase
    .from('bill_subjects')
    .insert(subjectsData)
    .select()

  if (subjectsError) throw subjectsError

  return {
    bill,
    subjects: billSubjects
  }
}

export const getBill = async (slug: string): Promise<Bill> => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

export const getBillById = async (id: number): Promise<Bill> => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const verifyBillPassword = async (id: number, hashedPassword: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('bills')
    .select('password')
    .eq('id', id)
    .single()

  if (error) throw error
  return data.password === hashedPassword
}

export const getBillSubjects = async (billId: number): Promise<BillSubject[]> => {
  const { data, error } = await supabase
    .from('bill_subjects')
    .select('*')
    .eq('bill_id', billId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export const getBillInformationHeaders = async (billId: number): Promise<BillInformationHeaderWithPaidBy[]> => {
  const { data, error } = await supabase
    .from('bill_information_headers')
    .select(`
      *,
      paid_by:bill_subjects!bill_information_headers_paid_by_id_fkey(*)
    `)
    .eq('bill_id', billId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getBillInformationDetails = async (headerId: number): Promise<BillInformationDetailWithChargedUser[]> => {
  const { data, error } = await supabase
    .from('bill_information_details')
    .select(`
      *,
      charged_user:bill_subjects!bill_information_details_charged_user_id_fkey(*)
    `)
    .eq('header_id', headerId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return data
}

export const getBillInformationDetailByBillId = async (billId: number): Promise<BillInformationDetailWithChargedUser[]> => {
  const { data, error } = await supabase
    .from('bill_information_details')
    .select(`
      *,
      charged_user:bill_subjects!bill_information_details_charged_user_id_fkey(*),
      header:bill_information_headers!bill_information_details_header_id_fkey(*)
    `)
    .eq('header.bill_id', billId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return data
}

export const getAllBills = async (): Promise<Bill[]> => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const createBillInformationHeader = async (
  billId: number,
  name: string,
  paidById: number,
  amount: number,
  billType: BillType = BillType.Others
): Promise<BillInformationHeader> => {
  const { data, error } = await supabase
    .from('bill_information_headers')
    .insert([
      {
        bill_id: billId,
        name,
        paid_by_id: paidById,
        amount,
        bill_type: billType
      }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export const createBillInformationDetails = async (
  headerId: number,
  details: Array<{ chargedUserId: number; amount: number }>
): Promise<BillInformationDetail[]> => {
  const detailsData = details.map(detail => ({
    header_id: headerId,
    charged_user_id: detail.chargedUserId,
    amount: detail.amount
  }))

  const { data, error } = await supabase
    .from('bill_information_details')
    .insert(detailsData)
    .select()

  if (error) throw error
  return data
}

export const createBillPayment = async (
  billId: number,
  payFromId: number,
  payToId: number,
  amount: number
): Promise<BillPayment> => {
  const { data, error } = await supabase
    .from('bill_payments')
    .insert([
      {
        bill_id: billId,
        pay_from_id: payFromId,
        pay_to_id: payToId,
        amount
      }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export const getBillPayments = async (billId: number): Promise<BillPaymentWithParticipants[]> => {
  const { data, error } = await supabase
    .from('bill_payments')
    .select(`
      *,
      paid_from:bill_subjects!bill_payments_pay_from_id_fkey(*),
      paid_to:bill_subjects!bill_payments_pay_to_id_fkey(*)
    `)
    .eq('bill_id', billId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const updateBillInformationHeader = async (
  headerId: number,
  name: string,
  paidById: number,
  amount: number,
  billType: BillType
): Promise<BillInformationHeader> => {
  const { data, error } = await supabase
    .from('bill_information_headers')
    .update({
      name,
      paid_by_id: paidById,
      amount,
      bill_type: billType
    })
    .eq('id', headerId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateBillInformationDetails = async (
  headerId: number,
  details: Array<{ chargedUserId: number; amount: number }>
): Promise<BillInformationDetail[]> => {
  // First, delete existing details for this header
  const { error: deleteError } = await supabase
    .from('bill_information_details')
    .delete()
    .eq('header_id', headerId)

  if (deleteError) throw deleteError

  // Then, create new details
  const detailsData = details.map(detail => ({
    header_id: headerId,
    charged_user_id: detail.chargedUserId,
    amount: detail.amount
  }))

  const { data, error } = await supabase
    .from('bill_information_details')
    .insert(detailsData)
    .select()

  if (error) throw error
  return data
}

export const deleteBillInformationHeader = async (headerId: number): Promise<void> => {
  // Delete details first (due to foreign key constraint)
  const { error: detailsError } = await supabase
    .from('bill_information_details')
    .delete()
    .eq('header_id', headerId)

  if (detailsError) throw detailsError

  // Then delete the header
  const { error: headerError } = await supabase
    .from('bill_information_headers')
    .delete()
    .eq('id', headerId)

  if (headerError) throw headerError
}

// Bill Payment operations
export const updateBillPayment = async (
  paymentId: number,
  payFromId: number,
  payToId: number,
  amount: number
): Promise<BillPayment> => {
  const { data, error } = await supabase
    .from('bill_payments')
    .update({
      pay_from_id: payFromId,
      pay_to_id: payToId,
      amount
    })
    .eq('id', paymentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteBillPayment = async (paymentId: number): Promise<void> => {
  const { error } = await supabase
    .from('bill_payments')
    .delete()
    .eq('id', paymentId)

  if (error) throw error
}

// Helper function to generate slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36)
}
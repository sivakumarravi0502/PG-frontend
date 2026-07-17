import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import api from '../../api/axios';
import CustomerPicker from '../ui/CustomerPicker';
import Modal from '../ui/Modal';

const CARD_MODES = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card',  label: 'Debit Card' },
  { value: 'upi',         label: 'UPI' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'wallet',      label: 'Wallet' },
];
const CARD_TYPES = [
  { value: 'visa', label: 'VISA' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'rupay', label: 'Rupay' },
  { value: 'amex', label: 'Amex' },
  { value: 'diner', label: 'Diner' },
  { value: 'business_corporate', label: 'Business/Corporate' },
  { value: 'other', label: 'Other' },
];

const amountTier = (amt) => (amt < 25000 ? 'below_25k' : amt < 50000 ? '25k_to_50k' : amt < 100000 ? '50k_to_1l' : 'above_1l');
const inr = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function TransactionForm({ editing, onSaved, onCancel }) {
  const isEdit = !!editing;
  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  const [customer, setCustomer] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [pgAccounts, setPgAccounts] = useState([]);
  const [pgCommercials, setPgCommercials] = useState([]);
  const [customerCommercials, setCustomerCommercials] = useState([]);
  const [specialCommercials, setSpecialCommercials] = useState([]);
  const [transferCharges, setTransferCharges] = useState([]);
  const [fulfilmentVendors, setFulfilmentVendors] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [addFulfilmentOpen, setAddFulfilmentOpen] = useState(false);

  const vendorId = watch('vendor_id');
  const vendorPgAccountId = watch('vendor_pg_account_id');
  const cardMode = watch('card_mode');
  const cardType = watch('card_type');
  const transactionCategory = watch('transaction_category');
  const amount = parseFloat(watch('amount')) || 0;

  // ── Reference data — fetched once, filtered client-side for zero-latency calculation ──
  useEffect(() => {
    api.get('/vendors', { params: { status: 'Active', limit: 100 } }).then(({ data }) => setVendors(data.data)).catch(() => {});
    api.get('/commercials/customer').then(({ data }) => setCustomerCommercials(data.data)).catch(() => {});
    api.get('/commercials/special').then(({ data }) => setSpecialCommercials(data.data)).catch(() => {});
    api.get('/fulfilment-vendors').then(({ data }) => setFulfilmentVendors(data.data)).catch(() => {});
    api.get('/bank-accounts', { params: { limit: 100 } }).then(({ data }) => setBankAccounts(data.data.filter(b => b.is_active))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!vendorId) { setPgAccounts([]); setTransferCharges([]); return; }
    api.get(`/vendors/${vendorId}/pg-accounts`, { params: { status: 'Active' } }).then(({ data }) => setPgAccounts(data.data)).catch(() => {});
    api.get(`/vendors/${vendorId}/transfer-charges`).then(({ data }) => setTransferCharges(data.data)).catch(() => {});
  }, [vendorId]);

  // A native <select> can't visually show a selected option that didn't exist in the
  // DOM yet when reset()/setValue() ran — these re-apply the saved value on the next
  // render after each option list actually lands, once the <option>s really exist.
  useEffect(() => { if (editing?.vendor_id && vendors.length) setValue('vendor_id', editing.vendor_id); }, [vendors, editing, setValue]);
  useEffect(() => { if (editing?.vendor_pg_account_id && pgAccounts.length) setValue('vendor_pg_account_id', editing.vendor_pg_account_id); }, [pgAccounts, editing, setValue]);
  useEffect(() => { if (editing?.fulfilment_vendor_id && fulfilmentVendors.length) setValue('fulfilment_vendor_id', editing.fulfilment_vendor_id); }, [fulfilmentVendors, editing, setValue]);
  useEffect(() => {
    if (bankAccounts.length) {
      if (editing?.credit_to_account_id) setValue('credit_to_account_id', editing.credit_to_account_id);
      if (editing?.transfer_bank_id) setValue('transfer_bank_id', editing.transfer_bank_id);
    }
  }, [bankAccounts, editing, setValue]);

  useEffect(() => {
    if (!vendorPgAccountId) { setPgCommercials([]); return; }
    api.get(`/vendors/pg-accounts/${vendorPgAccountId}/commercials`).then(({ data }) => setPgCommercials(data.data)).catch(() => {});
    const pg = pgAccounts.find(p => p.id === parseInt(vendorPgAccountId));
    if (pg) setValue('transaction_category', pg.transaction_category); // auto-fill from the PG account's own category
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorPgAccountId]);

  // ── Prefill when editing ──
  useEffect(() => {
    if (editing) {
      setCustomer({ id: editing.customer_id, name: editing.customer_name, customer_code: editing.customer_code, user_type: editing.user_type });
      reset({
        vendor_id: editing.vendor_id, vendor_pg_account_id: editing.vendor_pg_account_id,
        txn_date: editing.txn_date, transaction_category: editing.transaction_category,
        card_mode: editing.card_mode, card_type: editing.card_type, card_bank: editing.card_bank || '',
        amount: editing.amount, credit_to_account_id: editing.credit_to_account_id || '', credited: editing.credited,
        fulfilment_vendor_id: editing.fulfilment_vendor_id || '', transfer_bank_id: editing.transfer_bank_id || '',
        payout_txn_id: editing.payout_txn_id || '', status: editing.status, reason: editing.reason || '', notes: editing.notes || '',
      });
    } else {
      setCustomer(null);
      reset({
        vendor_id: '', vendor_pg_account_id: '', txn_date: new Date().toISOString().slice(0, 10),
        transaction_category: 'non_utility', card_mode: 'credit_card', card_type: 'visa', card_bank: '',
        amount: '', credit_to_account_id: '', credited: false, fulfilment_vendor_id: '', transfer_bank_id: '',
        payout_txn_id: '', status: 'pending', reason: '', notes: '',
      });
    }
  }, [editing, reset]);

  // ── Live, zero-latency calculation chain ──
  const feePercentage = useMemo(() => {
    if (!customer || !cardMode || !cardType || !transactionCategory) return 0;
    const table = customer.user_type === 'Special Customer' ? specialCommercials : customerCommercials;
    const match = table.find(r => r.card_type === cardMode && r.card_network === cardType && r.is_utility === transactionCategory);
    return match ? parseFloat(match.charge) : 0;
  }, [customer, cardMode, cardType, transactionCategory, customerCommercials, specialCommercials]);

  const pgMdrPercentage = useMemo(() => {
    if (!cardMode || !cardType) return 0;
    const match = pgCommercials.find(r => r.card_type === cardMode && r.card_network === cardType);
    return match ? parseFloat(match.charge) : 0;
  }, [cardMode, cardType, pgCommercials]);

  const commissionAmount = round2(amount * feePercentage / 100);
  const pgMdrAmount = round2(amount * pgMdrPercentage / 100);
  const businessMarginAmt = round2(commissionAmount - pgMdrAmount);
  const creditedAmount = round2(amount - commissionAmount);
  const payAmount = creditedAmount;

  const impsCharge = useMemo(() => {
    if (!payAmount) return 0;
    const tier = amountTier(payAmount);
    const match = transferCharges.find(r => r.transfer_type === 'imps' && r.amount_range === tier);
    return match ? parseFloat(match.charge) : 0;
  }, [payAmount, transferCharges]);

  const netBusinessProfit = round2(businessMarginAmt - impsCharge);

  const onSubmit = async (form) => {
    if (!customer) { toast.error('Select a customer'); return; }
    const payload = { ...form, customer_id: customer.id };
    try {
      if (isEdit) {
        await api.put(`/transactions/${editing.id}`, payload);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', payload);
        toast.success('Transaction saved');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save transaction');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Customer</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label-required">Customer</label>
            <CustomerPicker value={customer} onChange={setCustomer} placeholder="Search by name, mobile, or code..." />
            {customer && (
              <p className="text-xs text-muted-foreground mt-1">
                {customer.user_type} {customer.kyc_verified !== undefined && (customer.kyc_verified ? '· KYC Verified' : '· KYC Pending')}
              </p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label-required">Transaction Date</label>
            <input type="date" className="form-input" {...register('txn_date', { required: true })} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Pay-in Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="form-group">
            <label className="form-label-required">Vendor</label>
            <select className="form-select" {...register('vendor_id', { required: 'Required' })}
              onChange={(e) => { setValue('vendor_id', e.target.value); setValue('vendor_pg_account_id', ''); }}>
              <option value="">Select vendor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label-required">Payment Gateway</label>
            <select className="form-select" disabled={!vendorId} {...register('vendor_pg_account_id', { required: 'Required' })}>
              <option value="">Select PG account</option>
              {pgAccounts.map(p => <option key={p.id} value={p.id}>{p.payment_gateway}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label-required">Utility / Non Utility</label>
            <select className="form-select" {...register('transaction_category', { required: true })}>
              <option value="non_utility">Non Utility</option>
              <option value="utility">Utility</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label-required">Card Mode</label>
            <select className="form-select" {...register('card_mode', { required: true })}>
              {CARD_MODES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label-required">Card Type</label>
            <select className="form-select" {...register('card_type', { required: true })}>
              {CARD_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Card Issuing Bank</label>
            <input className="form-input" {...register('card_bank')} />
          </div>
          <div className="form-group">
            <label className="form-label-required">Amount</label>
            <input type="number" step="0.01" min="0" className="form-input" {...register('amount', { required: 'Required', min: 0.01 })} />
            {errors.amount && <p className="form-error">{errors.amount.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Credit to Account</label>
            <select className="form-select" {...register('credit_to_account_id')}>
              <option value="">Select account</option>
              {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.account_name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/50 rounded-md p-3 text-sm">
          <SummaryField label="PG MDR %" value={`${pgMdrPercentage.toFixed(2)}%`} />
          <SummaryField label="Fee %" value={`${feePercentage.toFixed(2)}%`} />
          <SummaryField label="Commission" value={inr(commissionAmount)} />
          <SummaryField label="Gross Margin" value={inr(businessMarginAmt)} highlight />
          <SummaryField label="PG MDR Amount" value={inr(pgMdrAmount)} />
          <SummaryField label="Credited Amount" value={inr(creditedAmount)} highlight />
          <label className="flex items-center gap-2 col-span-2">
            <input type="checkbox" className="w-4 h-4" {...register('credited')} />
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Credited to Business Wallet</span>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Pay-out Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="form-group">
            <label className="form-label">Fulfilment Vendor</label>
            <div className="flex gap-1.5">
              <select className="form-select flex-1" {...register('fulfilment_vendor_id')}>
                <option value="">Select vendor</option>
                {fulfilmentVendors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <button type="button" className="btn-outline btn-icon shrink-0" onClick={() => setAddFulfilmentOpen(true)} aria-label="Add fulfilment vendor">
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Transfer Bank</label>
            <select className="form-select" {...register('transfer_bank_id')}>
              <option value="">Select account</option>
              {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.account_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Payout Txn ID</label>
            <input className="form-input" {...register('payout_txn_id')} />
          </div>
          <div className="form-group">
            <label className="form-label-required">Status</label>
            <select className="form-select" {...register('status', { required: true })}>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="form-group sm:col-span-2">
            <label className="form-label">Reason</label>
            <input className="form-input" placeholder="NA, Not Accepted, Bank Hold..." {...register('reason')} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/50 rounded-md p-3 text-sm">
          <SummaryField label="Pay Amount" value={inr(payAmount)} />
          <SummaryField label="IMPS Charge" value={inr(impsCharge)} />
          <SummaryField label="Net Business Profit" value={inr(netBusinessProfit)} highlight />
        </div>
      </section>

      <section className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" {...register('notes')} />
      </section>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        {onCancel && <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Transaction'}
        </button>
      </div>

      <Modal open={addFulfilmentOpen} onOpenChange={setAddFulfilmentOpen} title="Add Fulfilment Vendor">
        <QuickAddFulfilmentVendor
          onCancel={() => setAddFulfilmentOpen(false)}
          onCreated={(fv) => { setFulfilmentVendors(list => [...list, fv]); setValue('fulfilment_vendor_id', fv.id); setAddFulfilmentOpen(false); }}
        />
      </Modal>
    </form>
  );
}

function SummaryField({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={highlight ? 'font-heading font-bold text-primary' : 'font-medium'}>{value}</p>
    </div>
  );
}

function QuickAddFulfilmentVendor({ onCancel, onCreated }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const submit = async (form) => {
    try {
      const { data } = await api.post('/fulfilment-vendors', form);
      toast.success('Fulfilment vendor added');
      onCreated(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add fulfilment vendor');
    }
  };
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="form-group">
        <label className="form-label-required">Name</label>
        <input className="form-input" {...register('name', { required: true })} />
      </div>
      <div className="form-group">
        <label className="form-label">Contact No</label>
        <input className="form-input" {...register('contact_no')} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Add'}</button>
      </div>
    </form>
  );
}

function round2(n) { return Math.round(n * 100) / 100; }

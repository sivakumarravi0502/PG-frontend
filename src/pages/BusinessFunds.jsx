import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Pencil } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/ui/Modal';
import CustomerPicker from '../components/ui/CustomerPicker';

const inr = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TABS = [
  { id: 'accounts', label: 'Accounts' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'balance-sheet', label: 'Balance Sheet' },
];

export default function BusinessFunds() {
  const [tab, setTab] = useState('accounts');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-heading font-semibold">Business Funds</h1>
        <p className="text-sm text-muted-foreground">Company's own bank accounts, fund movements, and balance sheet</p>
      </div>

      <div className="flex border-b border-border">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${tab === t.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'accounts' && <AccountsTab />}
      {tab === 'transactions' && <TransactionsTab />}
      {tab === 'balance-sheet' && <BalanceSheetTab />}
    </div>
  );
}

function AccountsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/business-funds/accounts');
      setRows(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Add Account</button>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr><th>Account Name</th><th>Bank</th><th>Account No.</th><th>IFSC</th><th>Opening Balance</th><th>Current Balance</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No fund accounts yet</td></tr>
            ) : (
              rows.map(a => (
                <tr key={a.id}>
                  <td className="font-medium">{a.account_name}</td>
                  <td>{a.bank_name}</td>
                  <td>{a.account_number || '—'}</td>
                  <td>{a.ifsc_code || '—'}</td>
                  <td>{inr(a.opening_balance)}</td>
                  <td className="font-semibold text-primary">{inr(a.current_balance)}</td>
                  <td>{a.is_active ? <span className="badge-success">Active</span> : <span className="badge-danger">Inactive</span>}</td>
                  <td><button className="action-btn-edit" onClick={() => { setEditing(a); setModalOpen(true); }} aria-label="Edit"><Pencil size={14} /></button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AccountFormModal open={modalOpen} onOpenChange={setModalOpen} editing={editing} onSaved={() => { setModalOpen(false); fetchAccounts(); }} />
    </div>
  );
}

function AccountFormModal({ open, onOpenChange, editing, onSaved }) {
  const isEdit = !!editing;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (!open) return;
    reset(isEdit
      ? { account_name: editing.account_name, bank_name: editing.bank_name, account_number: editing.account_number || '', ifsc_code: editing.ifsc_code || '', notes: editing.notes || '', is_active: editing.is_active ? 'true' : 'false' }
      : { account_name: '', bank_name: '', account_number: '', ifsc_code: '', opening_balance: '', notes: '', is_active: 'true' });
  }, [open, editing, isEdit, reset]);

  const onSubmit = async (form) => {
    try {
      if (isEdit) {
        await api.put(`/business-funds/accounts/${editing.id}`, { ...form, is_active: form.is_active === 'true' });
        toast.success('Account updated');
      } else {
        await api.post('/business-funds/accounts', form);
        toast.success('Account created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save account');
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEdit ? 'Edit Fund Account' : 'Add Fund Account'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="form-group">
          <label className="form-label-required">Account Name</label>
          <input className="form-input" {...register('account_name', { required: 'Required' })} />
          {errors.account_name && <p className="form-error">{errors.account_name.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label-required">Bank Name</label>
          <input className="form-input" {...register('bank_name', { required: 'Required' })} />
          {errors.bank_name && <p className="form-error">{errors.bank_name.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Account Number</label>
            <input className="form-input" {...register('account_number')} />
          </div>
          <div className="form-group">
            <label className="form-label">IFSC Code</label>
            <input className="form-input" {...register('ifsc_code')} />
          </div>
        </div>
        {!isEdit && (
          <div className="form-group">
            <label className="form-label-required">Opening Balance</label>
            <input type="number" step="0.01" className="form-input" {...register('opening_balance', { required: 'Required' })} />
            {errors.opening_balance && <p className="form-error">{errors.opening_balance.message}</p>}
          </div>
        )}
        {isEdit && (
          <div className="form-group">
            <label className="form-label-required">Status</label>
            <select className="form-select" {...register('is_active', { required: true })}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" {...register('notes')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={() => onOpenChange(false)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Account'}</button>
        </div>
      </form>
    </Modal>
  );
}

const TXN_TYPE_LABEL = { customer_payout: 'Customer Payout', pg_payment: 'PG Payment', miscellaneous: 'Miscellaneous', deposit: 'Deposit' };

function TransactionsTab() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [accountFilter, setAccountFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const limit = 20;

  const fetchAccounts = () => api.get('/business-funds/accounts').then(({ data }) => setAccounts(data.data)).catch(() => {});
  const fetchRows = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/business-funds/transactions', {
        params: { page, limit, fund_account_id: accountFilter || undefined, txn_type: typeFilter || undefined },
      });
      setRows(data.data);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);
  useEffect(() => { fetchRows(); }, [page, accountFilter, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <select className="form-select w-full sm:w-56" value={accountFilter} onChange={(e) => { setPage(1); setAccountFilter(e.target.value); }}>
            <option value="">All Accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name}</option>)}
          </select>
          <select className="form-select w-full sm:w-48" value={typeFilter} onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }}>
            <option value="">All Types</option>
            {Object.entries(TXN_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Add Transaction</button>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Account</th><th>Type</th><th>Entry</th><th>Amount</th><th>Balance After</th><th>Linked To</th><th>Comments</th><th>By</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No fund transactions yet</td></tr>
            ) : (
              rows.map(t => (
                <tr key={t.id}>
                  <td>{t.txn_date}</td>
                  <td className="font-medium">{t.account_name}</td>
                  <td><span className="badge-secondary">{TXN_TYPE_LABEL[t.txn_type]}</span></td>
                  <td>{t.entry_type === 'credit' ? <span className="badge-success">Credit</span> : <span className="badge-danger">Debit</span>}</td>
                  <td className={t.entry_type === 'credit' ? 'text-success font-semibold' : 'text-destructive font-semibold'}>{inr(t.amount)}</td>
                  <td>{inr(t.balance_after)}</td>
                  <td>{t.customer_name || t.vendor_name || '—'}</td>
                  <td className="max-w-[200px] truncate">{t.comments}</td>
                  <td>{t.created_by_name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {total} total</p>
          <div className="flex gap-2">
            <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      <TransactionFormModal open={modalOpen} onOpenChange={setModalOpen} accounts={accounts} onSaved={() => { setModalOpen(false); fetchRows(); fetchAccounts(); }} />
    </div>
  );
}

function TransactionFormModal({ open, onOpenChange, accounts, onSaved }) {
  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm();
  const [vendors, setVendors] = useState([]);
  const [customer, setCustomer] = useState(null);
  const txnType = watch('txn_type');

  useEffect(() => {
    if (!open) return;
    reset({ fund_account_id: '', txn_type: 'miscellaneous', amount: '', txn_date: new Date().toISOString().slice(0, 10), reference_vendor_id: '', comments: '' });
    setCustomer(null);
    api.get('/vendors', { params: { status: 'Active', limit: 100 } }).then(({ data }) => setVendors(data.data)).catch(() => {});
  }, [open, reset]);

  const onSubmit = async (form) => {
    if (form.txn_type === 'customer_payout' && !customer) { toast.error('Select a customer'); return; }
    const payload = { ...form, reference_customer_id: customer?.id };
    try {
      await api.post('/business-funds/transactions', payload);
      toast.success('Transaction recorded');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save transaction');
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add Fund Transaction">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="form-group">
          <label className="form-label-required">Fund Account</label>
          <select className="form-select" {...register('fund_account_id', { required: 'Required' })}>
            <option value="">Select account</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name} ({inr(a.current_balance)})</option>)}
          </select>
          {errors.fund_account_id && <p className="form-error">{errors.fund_account_id.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label-required">Transaction Type</label>
            <select className="form-select" {...register('txn_type', { required: true })}
              onChange={(e) => { setValue('txn_type', e.target.value); setCustomer(null); }}>
              {Object.entries(TXN_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Entry Type</label>
            <input className="form-input bg-muted" disabled value={txnType === 'deposit' ? 'Credit' : 'Debit'} />
          </div>
          <div className="form-group">
            <label className="form-label-required">Amount</label>
            <input type="number" step="0.01" min="0.01" className="form-input" {...register('amount', { required: 'Required', min: 0.01 })} />
            {errors.amount && <p className="form-error">{errors.amount.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label-required">Date</label>
            <input type="date" className="form-input" {...register('txn_date', { required: true })} />
          </div>
        </div>

        {txnType === 'customer_payout' && (
          <div className="form-group">
            <label className="form-label-required">Customer</label>
            <CustomerPicker value={customer} onChange={setCustomer} />
          </div>
        )}
        {txnType === 'pg_payment' && (
          <div className="form-group">
            <label className="form-label-required">Vendor</label>
            <select className="form-select" {...register('reference_vendor_id', { required: txnType === 'pg_payment' })}>
              <option value="">Select vendor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label-required">Comments</label>
          <textarea className="form-textarea" {...register('comments', { required: 'Required' })} />
          {errors.comments && <p className="form-error">{errors.comments.message}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={() => onOpenChange(false)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Transaction'}</button>
        </div>
      </form>
    </Modal>
  );
}

function BalanceSheetTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchSheet = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/business-funds/balance-sheet', { params: { date_from: dateFrom || undefined, date_to: dateTo || undefined } });
      setRows(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSheet(); }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = rows.reduce((acc, r) => ({
    opening: acc.opening + parseFloat(r.opening_balance),
    credits: acc.credits + parseFloat(r.total_credits),
    debits: acc.debits + parseFloat(r.total_debits),
    current: acc.current + parseFloat(r.current_balance),
  }), { opening: 0, credits: 0, debits: 0, current: 0 });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="form-group">
          <label className="form-label">From</label>
          <input type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">To</label>
          <input type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr><th>Account</th><th>Opening Balance</th><th>Total Credits</th><th>Total Debits</th><th>Current Balance</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No active fund accounts</td></tr>
            ) : (
              <>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.account_name} <span className="text-muted-foreground font-normal">({r.bank_name})</span></td>
                    <td>{inr(r.opening_balance)}</td>
                    <td className="text-success">{inr(r.total_credits)}</td>
                    <td className="text-destructive">{inr(r.total_debits)}</td>
                    <td className="font-semibold text-primary">{inr(r.current_balance)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-muted/50">
                  <td>Grand Total</td>
                  <td>{inr(totals.opening)}</td>
                  <td className="text-success">{inr(totals.credits)}</td>
                  <td className="text-destructive">{inr(totals.debits)}</td>
                  <td className="text-primary">{inr(totals.current)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

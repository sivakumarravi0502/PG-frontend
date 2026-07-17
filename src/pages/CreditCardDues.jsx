import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Search, CheckCircle2, CreditCard, Landmark, Hash, Calendar, Wallet } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/ui/Modal';
import CustomerPicker from '../components/ui/CustomerPicker';
import ViewToggle from '../components/ui/ViewToggle';
import GridCard from '../components/ui/GridCard';
import Pagination from '../components/ui/Pagination';

const CARD_TYPES = [
  { value: 'visa', label: 'VISA' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'rupay', label: 'Rupay' },
  { value: 'amex', label: 'Amex' },
  { value: 'diner', label: 'Diner' },
  { value: 'business_corporate', label: 'Business/Corporate' },
  { value: 'other', label: 'Other' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const addDays = (dateStr, days) => {
  if (!dateStr || !days) return '';
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + parseInt(days));
  return d.toISOString().slice(0, 10);
};
const billCycleFor = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${MONTHS[d.getUTCMonth()].toUpperCase()}-${d.getUTCFullYear()}`;
};

export default function CreditCardDues() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [view, setView] = useState('list');

  const limit = 20;

  const fetchRows = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/credit-card-dues', { params: { page, limit, search: search || undefined, status: statusFilter || undefined } });
      setRows(data.data);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load credit card dues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, [page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchRows(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setModalOpen(true); };

  const markPaid = async (row) => {
    try {
      await api.patch(`/credit-card-dues/${row.id}/mark-paid`);
      toast.success('Marked as paid');
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark paid');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/credit-card-dues/${deleteTarget.id}`);
      toast.success('Credit card due removed');
      setDeleteTarget(null);
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove credit card due');
    }
  };

  const columns = useMemo(() => [
    { header: 'Customer', accessorKey: 'customer_name' },
    { header: 'Customer ID', accessorKey: 'customer_code' },
    { header: 'Name on CC', accessorKey: 'name_on_card' },
    { header: 'CC Bank', accessorKey: 'card_bank' },
    { header: 'CC ID', accessorKey: 'card_id' },
    { header: 'Variant', accessorKey: 'card_variant', cell: ({ getValue }) => getValue() || '—' },
    { header: 'Last 4', accessorKey: 'last_4_digit' },
    { header: 'Card Limit', accessorKey: 'card_limit', cell: ({ getValue }) => getValue() ? `₹${parseFloat(getValue()).toLocaleString('en-IN')}` : '—' },
    { header: 'Bill Date', accessorKey: 'bill_date' },
    { header: 'No. of Days', accessorKey: 'no_of_days_for_due' },
    { header: 'Due Date', accessorKey: 'due_date' },
    { header: 'Bill Cycle', accessorKey: 'bill_cycle' },
    {
      header: 'Status', accessorKey: 'status',
      cell: ({ getValue }) => getValue() === 'paid' ? <span className="badge-success">Paid</span> : <span className="badge-warning">Pending</span>,
    },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.status === 'pending' && (
            <button className="action-btn-view" onClick={() => markPaid(row.original)} title="Mark Paid" aria-label="Mark Paid"><CheckCircle2 size={14} /></button>
          )}
          <button className="action-btn-edit" onClick={() => openEdit(row.original)} aria-label="Edit"><Pencil size={14} /></button>
          <button className="action-btn-delete" onClick={() => setDeleteTarget(row.original)} aria-label="Delete"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-heading font-semibold">Credit Card Dues</h1>
          <p className="text-sm text-muted-foreground">Track customer CC bill due dates for follow-up reminders</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Credit Card</button>
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="form-input pl-9" placeholder="Search customer, CC ID, name on card..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select w-full sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === 'list' && (
          <>
            <div className="table-wrapper border-0 rounded-none">
              <table className="table">
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>{hg.headers.map(h => <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
                  ))}
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={columns.length} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={columns.length} className="text-center py-8 text-muted-foreground">No credit cards tracked yet</td></tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} itemLabel="credit cards" />
          </>
        )}
      </div>

      {view === 'grid' && (
        loading ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No credit cards tracked yet</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {rows.map(r => (
                <GridCard
                  key={r.id}
                  icon={<CreditCard size={20} />}
                  iconColor="bg-info text-white"
                  title={r.name_on_card}
                  meta={`${r.customer_name} (${r.customer_code})`}
                  badge={r.status === 'paid' ? <span className="badge-success">Paid</span> : <span className="badge-warning">Pending</span>}
                  stats={[
                    { icon: <Landmark size={14} />, value: r.card_bank, label: 'CC Bank' },
                    { icon: <Hash size={14} />, value: r.card_id, label: 'CC ID' },
                    { icon: <Calendar size={14} />, value: r.due_date, label: 'Due Date' },
                    { icon: <Wallet size={14} />, value: r.card_limit ? `₹${parseFloat(r.card_limit).toLocaleString('en-IN')}` : '—', label: 'Card Limit' },
                  ]}
                  menuItems={[
                    r.status === 'pending' && { label: 'Mark Paid', icon: <CheckCircle2 size={14} />, onClick: () => markPaid(r) },
                    { label: 'Edit', icon: <Pencil size={14} />, onClick: () => openEdit(r) },
                    { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => setDeleteTarget(r), danger: true },
                  ]}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} itemLabel="credit cards" />
          </>
        )
      )}

      <CcDueFormModal open={modalOpen} onOpenChange={setModalOpen} editing={editing} onSaved={() => { setModalOpen(false); fetchRows(); }} />

      <Modal open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Remove credit card?">
        <p className="text-sm text-muted-foreground mb-4">"{deleteTarget?.name_on_card}" ({deleteTarget?.card_id}) will be permanently removed.</p>
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete}>Remove</button>
        </div>
      </Modal>
    </div>
  );
}

function CcDueFormModal({ open, onOpenChange, editing, onSaved }) {
  const isEdit = !!editing;
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  const [customer, setCustomer] = useState(null);

  const billDate = watch('bill_date');
  const noOfDays = watch('no_of_days_for_due');
  const dueDate = addDays(billDate, noOfDays);
  const billCycle = billCycleFor(billDate);

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setCustomer({ id: editing.customer_id, name: editing.customer_name, customer_code: editing.customer_code });
      reset({
        card_bank: editing.card_bank, card_type: editing.card_type, card_variant: editing.card_variant || '',
        name_on_card: editing.name_on_card, card_id: editing.card_id, last_4_digit: editing.last_4_digit,
        card_limit: editing.card_limit || '', bill_date: editing.bill_date, no_of_days_for_due: editing.no_of_days_for_due,
        remarks: editing.remarks, status: editing.status,
      });
    } else {
      setCustomer(null);
      reset({
        card_bank: '', card_type: 'visa', card_variant: '', name_on_card: '', card_id: '', last_4_digit: '',
        card_limit: '', bill_date: '', no_of_days_for_due: '', remarks: '', status: 'pending',
      });
    }
  }, [open, editing, isEdit, reset]);

  const onSubmit = async (form) => {
    if (!customer) { toast.error('Select a customer'); return; }
    const payload = { ...form, customer_id: customer.id };
    try {
      if (isEdit) {
        await api.put(`/credit-card-dues/${editing.id}`, payload);
        toast.success('Credit card due updated');
      } else {
        await api.post('/credit-card-dues', payload);
        toast.success('Credit card due added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save credit card due');
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEdit ? 'Edit Credit Card' : 'Add Credit Card'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="form-group">
          <label className="form-label-required">Customer</label>
          <CustomerPicker value={customer} onChange={setCustomer} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label-required">Credit Card Bank</label>
            <input className="form-input" placeholder="e.g. HDFC Bank" {...register('card_bank', { required: 'Required' })} />
            {errors.card_bank && <p className="form-error">{errors.card_bank.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label-required">Credit Card Type</label>
            <select className="form-select" {...register('card_type', { required: true })}>
              {CARD_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Card Variant</label>
            <input className="form-input" placeholder="e.g. Regalia, Millennia" {...register('card_variant')} />
          </div>
          <div className="form-group">
            <label className="form-label-required">Name on Card</label>
            <input className="form-input" {...register('name_on_card', { required: 'Required' })} />
            {errors.name_on_card && <p className="form-error">{errors.name_on_card.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label-required">Card ID</label>
            <input className="form-input" placeholder="e.g. CC3559" {...register('card_id', { required: 'Required' })} />
            {errors.card_id && <p className="form-error">{errors.card_id.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label-required">Last 4 Digit</label>
            <input className="form-input" maxLength={4} {...register('last_4_digit', { required: 'Required', minLength: 4, maxLength: 4 })} />
            {errors.last_4_digit && <p className="form-error">Must be exactly 4 digits</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Card Limit</label>
            <input type="number" step="0.01" className="form-input" {...register('card_limit')} />
          </div>
          <div className="form-group">
            <label className="form-label-required">Status</label>
            <select className="form-select" {...register('status', { required: true })}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label-required">Bill Date</label>
            <input type="date" className="form-input" {...register('bill_date', { required: 'Required' })} />
            {errors.bill_date && <p className="form-error">{errors.bill_date.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label-required">No. of Days for Due</label>
            <input type="number" min="1" className="form-input" {...register('no_of_days_for_due', { required: 'Required', min: 1 })} />
            {errors.no_of_days_for_due && <p className="form-error">{errors.no_of_days_for_due.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/50 rounded-md p-3 text-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Due Date (auto-calculated)</p>
            <p className="font-heading font-bold text-primary">{dueDate || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Bill Cycle (auto-derived)</p>
            <p className="font-medium">{billCycle || '—'}</p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label-required">Remarks</label>
          <input className="form-input" {...register('remarks', { required: 'Required' })} />
          {errors.remarks && <p className="form-error">{errors.remarks.message}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" className="btn-outline" onClick={() => onOpenChange(false)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Credit Card'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

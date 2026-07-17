import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Search, Landmark, Hash, CreditCard, Tag } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import ViewToggle from '../../components/ui/ViewToggle';
import GridCard from '../../components/ui/GridCard';
import Pagination from '../../components/ui/Pagination';

export default function BankAccounts() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [view, setView] = useState('list');

  const limit = 20;

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bank-accounts', { params: { page, limit, search: search || undefined } });
      setRows(data.data);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  // Fetched once — reused by the form's vendor dropdown so staff never retype a vendor name.
  const fetchVendors = async () => {
    try {
      const { data } = await api.get('/vendors', { params: { limit: 100 } });
      setVendors(data.data);
    } catch { /* silent — dropdown just stays empty */ }
  };

  useEffect(() => { fetchVendors(); }, []);
  useEffect(() => { fetchAccounts(); }, [page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchAccounts(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (acc) => { setEditing(acc); setModalOpen(true); };

  const handleDelete = async () => {
    try {
      await api.delete(`/bank-accounts/${deleteTarget.id}`);
      toast.success('Bank account deleted');
      setDeleteTarget(null);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete bank account');
    }
  };

  const columns = useMemo(() => [
    { header: 'Account Name', accessorKey: 'account_name' },
    { header: 'Vendor', accessorKey: 'vendor_name', cell: ({ getValue }) => getValue() || <span className="text-muted-foreground">NA</span> },
    { header: 'Account No.', accessorKey: 'account_number', cell: ({ getValue }) => getValue() || '—' },
    { header: 'IFSC Code', accessorKey: 'ifsc_code', cell: ({ getValue }) => getValue() || '—' },
    {
      header: 'Type', accessorKey: 'account_type',
      cell: ({ getValue }) => <span className={`uppercase ${getValue() === 'imps' ? 'badge-info' : 'badge-primary'}`}>{getValue()}</span>,
    },
    {
      header: 'Status', accessorKey: 'is_active',
      cell: ({ getValue }) => getValue() ? <span className="badge-success">Active</span> : <span className="badge-danger">Inactive</span>,
    },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
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
          <h1 className="text-xl font-heading font-semibold">Bank Account</h1>
          <p className="text-sm text-muted-foreground">Business bank accounts used for pay-in/pay-out routing</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Bank Account</button>
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="form-input pl-9" placeholder="Search account name, number..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
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
                    <tr><td colSpan={columns.length} className="text-center py-8 text-muted-foreground">No bank accounts found</td></tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} itemLabel="bank accounts" />
          </>
        )}
      </div>

      {view === 'grid' && (
        loading ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No bank accounts found</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {rows.map(a => (
                <GridCard
                  key={a.id}
                  icon={<Landmark size={20} />}
                  iconColor="bg-primary text-white"
                  title={a.account_name}
                  meta={a.vendor_name || 'NA'}
                  badge={a.is_active ? <span className="badge-success">Active</span> : <span className="badge-danger">Inactive</span>}
                  stats={[
                    { icon: <Hash size={14} />, value: a.account_number || '—', label: 'Account No.' },
                    { icon: <CreditCard size={14} />, value: a.ifsc_code || '—', label: 'IFSC Code' },
                    { icon: <Tag size={14} />, value: <span className={`uppercase ${a.account_type === 'imps' ? 'badge-info' : 'badge-primary'}`}>{a.account_type}</span>, label: 'Type' },
                  ]}
                  menuItems={[
                    { label: 'Edit', icon: <Pencil size={14} />, onClick: () => openEdit(a) },
                    { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => setDeleteTarget(a), danger: true },
                  ]}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} itemLabel="bank accounts" />
          </>
        )
      )}

      <BankAccountFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        vendors={vendors}
        onSaved={() => { setModalOpen(false); fetchAccounts(); }}
      />

      <Modal open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Delete bank account?">
        <p className="text-sm text-muted-foreground mb-4">
          This will permanently remove "{deleteTarget?.account_name}". This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}

function BankAccountFormModal({ open, onOpenChange, editing, vendors, onSaved }) {
  const isEdit = !!editing;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (open) {
      reset(isEdit
        ? { account_name: editing.account_name, vendor_id: editing.vendor_id || '', account_number: editing.account_number || '', ifsc_code: editing.ifsc_code || '', account_type: editing.account_type, is_active: editing.is_active ? 'true' : 'false' }
        : { account_name: '', vendor_id: '', account_number: '', ifsc_code: '', account_type: 'account', is_active: 'true' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const onSubmit = async (form) => {
    const payload = {
      account_name: form.account_name,
      vendor_id: form.vendor_id || null,
      account_number: form.account_number || null,
      ifsc_code: form.ifsc_code || null,
      account_type: form.account_type,
      is_active: form.is_active === 'true',
    };
    try {
      if (isEdit) {
        await api.put(`/bank-accounts/${editing.id}`, payload);
        toast.success('Bank account updated');
      } else {
        await api.post('/bank-accounts', payload);
        toast.success('Bank account created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save bank account');
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEdit ? 'Edit Bank Account' : 'Add Bank Account'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="form-group">
          <label className="form-label-required">Account Name</label>
          <input className="form-input" {...register('account_name', { required: 'Account name is required' })} />
          {errors.account_name && <p className="form-error">{errors.account_name.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Vendor <span className="text-muted-foreground font-normal">(optional)</span></label>
          <select className="form-select" {...register('vendor_id')}>
            <option value="">NA</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label-required">Account Type</label>
            <select className="form-select" {...register('account_type', { required: true })}>
              <option value="account">Account</option>
              <option value="imps">IMPS</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label-required">Status</label>
            <select className="form-select" {...register('is_active', { required: true })}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={() => onOpenChange(false)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Bank Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

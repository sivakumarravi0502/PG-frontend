import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Search, Eye, UserRound, Phone, Tag, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { solidClass } from '../lib/utils';
import Modal from '../components/ui/Modal';
import CustomerPicker from '../components/ui/CustomerPicker';
import ViewToggle from '../components/ui/ViewToggle';
import GridCard from '../components/ui/GridCard';
import Pagination from '../components/ui/Pagination';

export default function Customers() {
  const { employee } = useAuthStore();
  const canEdit = employee?.role !== 'viewer';

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [view, setView] = useState('list');

  const limit = 20;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customers', {
        params: { page, limit, search: search || undefined, status: statusFilter || undefined, user_type: userTypeFilter || undefined },
      });
      setRows(data.data);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [page, statusFilter, userTypeFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchCustomers(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => { setEditing(null); setViewOnly(false); setModalOpen(true); };
  const openRow = async (row, readOnly) => {
    try {
      const { data } = await api.get(`/customers/${row.id}`);
      setEditing(data.data);
      setViewOnly(readOnly);
      setModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load customer');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/customers/${deleteTarget.id}`);
      toast.success('Customer deactivated');
      setDeleteTarget(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate customer');
    }
  };

  const columns = useMemo(() => [
    {
      header: '', id: 'photo',
      cell: ({ row }) => row.original.photo
        ? <img src={row.original.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
        : <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><UserRound size={14} /></div>,
    },
    { header: 'Customer Code', accessorKey: 'customer_code' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Mobile', accessorKey: 'whatsapp_no' },
    {
      header: 'User Type', accessorKey: 'user_type',
      cell: ({ getValue }) => <span className={getValue() === 'Special Customer' ? 'badge-secondary' : 'badge-info'}>{getValue()}</span>,
    },
    {
      header: 'KYC', accessorKey: 'kyc_verified',
      cell: ({ getValue }) => getValue() ? <span className="badge-success">Verified</span> : <span className="badge-neutral">Pending</span>,
    },
    {
      header: 'Status', accessorKey: 'status',
      cell: ({ getValue }) => getValue() === 'Active' ? <span className="badge-success">Active</span> : <span className="badge-danger">Inactive</span>,
    },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {canEdit ? (
            <>
              <button className="action-btn-edit" onClick={() => openRow(row.original, false)} aria-label="Edit"><Pencil size={14} /></button>
              <button className="action-btn-delete" onClick={() => setDeleteTarget(row.original)} aria-label="Deactivate"><Trash2 size={14} /></button>
            </>
          ) : (
            <button className="action-btn-view" onClick={() => openRow(row.original, true)} aria-label="View"><Eye size={14} /></button>
          )}
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canEdit]);

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-heading font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">People who make card payments through the business</p>
        </div>
        {canEdit && <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Customer</button>}
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="form-input pl-9" placeholder="Search name, mobile, code..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <select className="form-select w-full sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select className="form-select w-full sm:w-48" value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)}>
              <option value="">All User Types</option>
              <option value="Normal Customer">Normal Customer</option>
              <option value="Special Customer">Special Customer</option>
            </select>
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
                    <tr><td colSpan={columns.length} className="text-center py-8 text-muted-foreground">No customers found</td></tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} itemLabel="customers" />
          </>
        )}
      </div>

      {view === 'grid' && (
        loading ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No customers found</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {rows.map(c => (
                <GridCard
                  key={c.id}
                  icon={c.photo ? <img src={c.photo} alt="" className="w-full h-full object-cover" /> : <UserRound size={20} />}
                  iconColor={c.photo ? 'bg-muted' : solidClass(c.name)}
                  title={c.name}
                  meta={c.customer_code}
                  badge={c.status === 'Active' ? <span className="badge-success">Active</span> : <span className="badge-danger">Inactive</span>}
                  stats={[
                    { icon: <Phone size={14} />, value: c.whatsapp_no, label: 'Mobile' },
                    { icon: <Tag size={14} />, value: c.user_type, label: 'User Type' },
                    { icon: <ShieldCheck size={14} />, value: c.kyc_verified ? 'Verified' : 'Pending', label: 'KYC Status' },
                  ]}
                  menuItems={canEdit ? [
                    { label: 'Edit', icon: <Pencil size={14} />, onClick: () => openRow(c, false) },
                    { label: 'Deactivate', icon: <Trash2 size={14} />, onClick: () => setDeleteTarget(c), danger: true },
                  ] : [
                    { label: 'View', icon: <Eye size={14} />, onClick: () => openRow(c, true) },
                  ]}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} itemLabel="customers" />
          </>
        )
      )}

      <CustomerFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        viewOnly={viewOnly}
        onSaved={() => { setModalOpen(false); fetchCustomers(); }}
      />

      <Modal open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Deactivate customer?">
        <p className="text-sm text-muted-foreground mb-4">
          {deleteTarget?.name} will be marked Inactive. This can be reversed by editing their status back to Active.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete}>Deactivate</button>
        </div>
      </Modal>
    </div>
  );
}

function CustomerFormModal({ open, onOpenChange, editing, viewOnly, onSaved }) {
  const isEdit = !!editing;
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm();
  const [referredBy, setReferredBy] = useState(null);
  const sameAsCurrent = watch('same_as_current');
  const currentAddress = watch('current_address');

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      reset({
        name: editing.name, whatsapp_no: editing.whatsapp_no, alternate_no: editing.alternate_no || '',
        date_of_birth: editing.date_of_birth || '', current_address: editing.current_address,
        permanent_address: editing.permanent_address, same_as_current: editing.same_as_current,
        office_name: editing.office_name, office_address: editing.office_address,
        aadhar_number: editing.aadhar_number || '', pan_number: editing.pan_number || '',
        remark: editing.remark, status: editing.status, user_type: editing.user_type,
        kyc_verified: editing.kyc_verified,
      });
      setReferredBy(editing.referred_by ? { id: editing.referred_by, name: editing.referred_by_name, customer_code: editing.referred_by_code } : null);
    } else {
      reset({
        name: '', whatsapp_no: '', alternate_no: '', date_of_birth: '', current_address: '',
        permanent_address: '', same_as_current: false, office_name: '', office_address: '',
        aadhar_number: '', pan_number: '', remark: '', status: 'Active', user_type: 'Normal Customer', kyc_verified: false,
      });
      setReferredBy(null);
    }
  }, [open, editing, isEdit, reset]);

  // Keep permanent address mirrored live while "same as current" is checked —
  // no need to retype an address that's already on screen.
  useEffect(() => {
    if (sameAsCurrent) setValue('permanent_address', currentAddress);
  }, [sameAsCurrent, currentAddress, setValue]);

  const onSubmit = async (form) => {
    const fd = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === 'photo' || key === 'aadhar_front_image' || key === 'aadhar_back_image' || key === 'pan_image') {
        if (val?.[0]) fd.append(key, val[0]);
      } else if (val !== undefined && val !== null) {
        fd.append(key, val);
      }
    });
    fd.set('same_as_current', form.same_as_current ? 'true' : 'false');
    fd.set('kyc_verified', form.kyc_verified ? 'true' : 'false');
    if (referredBy) fd.set('referred_by', referredBy.id);

    try {
      if (isEdit) {
        await api.put(`/customers/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Customer updated');
      } else {
        await api.post('/customers', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Customer created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save customer');
    }
  };

  const disabled = viewOnly;
  const title = viewOnly ? 'Customer Details' : isEdit ? 'Edit Customer' : 'Add Customer';

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} maxWidth="max-w-3xl">
      <fieldset disabled={disabled} className={disabled ? 'opacity-90' : ''}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Basic Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label-required">Name</label>
                <input className="form-input" {...register('name', { required: 'Required' })} />
                {errors.name && <p className="form-error">{errors.name.message}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Photo</label>
                {isEdit && editing.photo && <img src={editing.photo} alt="" className="w-10 h-10 rounded-full object-cover mb-1" />}
                <input type="file" accept="image/png,image/jpeg" className="form-input" {...register('photo')} />
              </div>
              <div className="form-group">
                <label className="form-label-required">WhatsApp No</label>
                <input className="form-input" {...register('whatsapp_no', { required: 'Required' })} />
                {errors.whatsapp_no && <p className="form-error">{errors.whatsapp_no.message}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Alternate No</label>
                <input className="form-input" {...register('alternate_no')} />
              </div>
              <div className="form-group">
                <label className="form-label-required">Date of Birth</label>
                <input type="date" className="form-input" {...register('date_of_birth', { required: 'Required' })} />
                {errors.date_of_birth && <p className="form-error">{errors.date_of_birth.message}</p>}
              </div>
              <div className="form-group">
                <label className="form-label-required">User Type</label>
                <select className="form-select" {...register('user_type', { required: true })}>
                  <option value="Normal Customer">Normal Customer</option>
                  <option value="Special Customer">Special Customer</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Address</h3>
            <div className="form-group">
              <label className="form-label-required">Current Address</label>
              <textarea className="form-textarea" {...register('current_address', { required: 'Required' })} />
              {errors.current_address && <p className="form-error">{errors.current_address.message}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="w-4 h-4" {...register('same_as_current')} />
              Same as Current Address
            </label>
            <div className="form-group">
              <label className="form-label-required">Permanent Address</label>
              <textarea className="form-textarea" disabled={disabled || sameAsCurrent} {...register('permanent_address', { required: 'Required' })} />
              {errors.permanent_address && <p className="form-error">{errors.permanent_address.message}</p>}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Office &amp; Referral</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label-required">Office Name</label>
                <input className="form-input" {...register('office_name', { required: 'Required' })} />
                {errors.office_name && <p className="form-error">{errors.office_name.message}</p>}
              </div>
              <div className="form-group">
                <label className="form-label-required">Office Address</label>
                <input className="form-input" {...register('office_address', { required: 'Required' })} />
                {errors.office_address && <p className="form-error">{errors.office_address.message}</p>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Referred By</label>
              {disabled ? (
                <p className="form-input bg-muted">{referredBy ? `${referredBy.name} (${referredBy.customer_code})` : 'NA'}</p>
              ) : (
                <CustomerPicker value={referredBy} onChange={setReferredBy} excludeId={editing?.id} />
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">KYC Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Aadhar Number</label>
                <input className="form-input" {...register('aadhar_number')} />
              </div>
              <div className="form-group">
                <label className="form-label">PAN Number</label>
                <input className="form-input" {...register('pan_number')} />
              </div>
              <div className="form-group">
                <label className="form-label">Aadhar Front Image</label>
                {isEdit && editing.aadhar_front_image && <img src={editing.aadhar_front_image} alt="" className="h-12 rounded mb-1" />}
                <input type="file" accept="image/png,image/jpeg" className="form-input" {...register('aadhar_front_image')} />
              </div>
              <div className="form-group">
                <label className="form-label">Aadhar Back Image</label>
                {isEdit && editing.aadhar_back_image && <img src={editing.aadhar_back_image} alt="" className="h-12 rounded mb-1" />}
                <input type="file" accept="image/png,image/jpeg" className="form-input" {...register('aadhar_back_image')} />
              </div>
              <div className="form-group">
                <label className="form-label">PAN Image</label>
                {isEdit && editing.pan_image && <img src={editing.pan_image} alt="" className="h-12 rounded mb-1" />}
                <input type="file" accept="image/png,image/jpeg" className="form-input" {...register('pan_image')} />
              </div>
              <label className="flex items-center gap-2 text-sm self-end pb-2">
                <input type="checkbox" className="w-4 h-4" {...register('kyc_verified')} />
                KYC Verified
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Meta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label-required">Remark</label>
                <input className="form-input" {...register('remark', { required: 'Required' })} />
                {errors.remark && <p className="form-error">{errors.remark.message}</p>}
              </div>
              <div className="form-group">
                <label className="form-label-required">Status</label>
                <select className="form-select" {...register('status', { required: true })}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </section>

          {!viewOnly && (
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button type="button" className="btn-outline" onClick={() => onOpenChange(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Customer'}
              </button>
            </div>
          )}
        </form>
      </fieldset>
    </Modal>
  );
}

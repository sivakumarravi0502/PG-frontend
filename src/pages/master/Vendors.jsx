import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Search, Building2, Landmark } from 'lucide-react';
import api from '../../api/axios';
import { solidClass } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import ViewToggle from '../../components/ui/ViewToggle';
import GridCard from '../../components/ui/GridCard';
import Pagination from '../../components/ui/Pagination';
import PgAccountsDrawer from './vendor/PgAccountsDrawer';
import ImpsChargesSection from './vendor/ImpsChargesSection';

export default function Vendors() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pgDrawerVendor, setPgDrawerVendor] = useState(null);
  const [view, setView] = useState('list');

  const limit = 20;

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vendors', { params: { page, limit, search: search || undefined } });
      setRows(data.data);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, [page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchVendors(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (v) => { setEditing(v); setModalOpen(true); };

  const handleDelete = async () => {
    try {
      await api.delete(`/vendors/${deleteTarget.id}`);
      toast.success('Vendor deleted');
      setDeleteTarget(null);
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete vendor');
    }
  };

  const columns = useMemo(() => [
    {
      header: 'Logo', id: 'logo',
      cell: ({ row }) => row.original.logo
        ? <img src={row.original.logo} alt="" className="w-8 h-8 rounded object-contain bg-muted" />
        : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground"><Building2 size={14} /></div>,
    },
    { header: 'Vendor Name', accessorKey: 'name' },
    { header: 'PG Accounts', accessorKey: 'pg_account_count', cell: ({ getValue }) => <span className="badge-neutral">{getValue()}</span> },
    {
      header: 'Status', accessorKey: 'status',
      cell: ({ getValue }) => getValue() === 'Active' ? <span className="badge-success">Active</span> : <span className="badge-danger">Inactive</span>,
    },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button className="action-btn-view" onClick={() => setPgDrawerVendor(row.original)} title="Payment Gateway List">
            <Landmark size={14} />
          </button>
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
          <h1 className="text-xl font-heading font-semibold">Vendor</h1>
          <p className="text-sm text-muted-foreground">PG providers, their payment gateway accounts, and IMPS fee tiers</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Vendor</button>
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="form-input pl-9" placeholder="Search vendor name..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <tr><td colSpan={columns.length} className="text-center py-8 text-muted-foreground">No vendors found</td></tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} itemLabel="vendors" />
          </>
        )}
      </div>

      {view === 'grid' && (
        loading ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No vendors found</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {rows.map(v => (
                <GridCard
                  key={v.id}
                  icon={v.logo ? <img src={v.logo} alt="" className="w-full h-full object-contain" /> : <Building2 size={20} />}
                  iconColor={v.logo ? 'bg-muted' : solidClass(v.name)}
                  title={v.name}
                  meta={`${v.pg_account_count} payment gateway${v.pg_account_count === 1 ? '' : 's'}`}
                  badge={v.status === 'Active' ? <span className="badge-success">Active</span> : <span className="badge-danger">Inactive</span>}
                  stats={[{ icon: <Landmark size={14} />, value: v.pg_account_count, label: 'PG Accounts' }]}
                  menuItems={[
                    { label: 'Payment Gateways', icon: <Landmark size={14} />, onClick: () => setPgDrawerVendor(v) },
                    { label: 'Edit', icon: <Pencil size={14} />, onClick: () => openEdit(v) },
                    { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => setDeleteTarget(v), danger: true },
                  ]}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} itemLabel="vendors" />
          </>
        )
      )}

      <VendorFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        onCreated={(vendor) => { setEditing(vendor); fetchVendors(); }}
        onSaved={() => { fetchVendors(); }}
      />

      <Modal open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Delete vendor?">
        <p className="text-sm text-muted-foreground mb-4">
          "{deleteTarget?.name}" and all its payment gateways, commercials and IMPS tiers will be permanently removed.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>

      <PgAccountsDrawer
        open={!!pgDrawerVendor}
        onOpenChange={(v) => !v && setPgDrawerVendor(null)}
        vendor={pgDrawerVendor}
        onChanged={fetchVendors}
      />
    </div>
  );
}

function VendorFormModal({ open, onOpenChange, editing, onCreated, onSaved }) {
  const isEdit = !!editing;
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();
  const logoFile = watch('logo');

  useEffect(() => {
    if (open) reset({ name: editing?.name || '', status: editing?.status || 'Active', logo: undefined });
  }, [open, editing, reset]);

  const onSubmit = async (form) => {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('status', form.status);
    if (form.logo?.[0]) fd.append('logo', form.logo[0]);

    try {
      if (isEdit) {
        const { data } = await api.put(`/vendors/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Vendor updated');
        onSaved();
        onCreated(data.data);
      } else {
        const { data } = await api.post('/vendors', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Vendor created — add IMPS charges below, or close when done');
        onCreated(data.data); // keep the modal open, now in edit mode, so IMPS charges can be filled in without leaving
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save vendor');
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEdit ? 'Edit Vendor' : 'Add Vendor'} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="form-group">
          <label className="form-label-required">Vendor Name</label>
          <input className="form-input" {...register('name', { required: 'Vendor name is required' })} />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Logo</label>
          {editing?.logo && <img src={editing.logo} alt="" className="w-12 h-12 rounded object-contain bg-muted mb-2" />}
          <input type="file" accept="image/png,image/jpeg" className="form-input" {...register('logo')} />
          {logoFile?.[0] && <p className="text-xs text-muted-foreground mt-1">{logoFile[0].name}</p>}
        </div>

        <div className="form-group">
          <label className="form-label-required">Status</label>
          <select className="form-select" {...register('status', { required: true })}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={() => onOpenChange(false)}>Close</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Vendor'}
          </button>
        </div>
      </form>

      {isEdit && (
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-sm font-heading font-semibold mb-3">IMPS Charges</h3>
          <ImpsChargesSection vendorId={editing.id} />
        </div>
      )}
    </Modal>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Search, Phone, Activity } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { solidClass } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import ViewToggle from '../../components/ui/ViewToggle';
import GridCard from '../../components/ui/GridCard';
import Pagination from '../../components/ui/Pagination';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin',       label: 'Admin' },
  { value: 'data_entry',  label: 'Data Entry' },
  { value: 'viewer',      label: 'Viewer' },
];

const roleLabel = (role) => ROLES.find(r => r.value === role)?.label || role;
const ROLE_BADGE = {
  super_admin: 'badge-secondary', // violet — highest privilege
  admin:       'badge-primary',   // blue
  data_entry:  'badge-success',   // emerald
  viewer:      'badge-neutral',   // gray — read-only
};

export default function Users() {
  const { employee: currentEmployee } = useAuthStore();
  const isSuperAdmin = currentEmployee?.role === 'super_admin';

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [view, setView] = useState('list');

  const limit = 20;

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/employees', { params: { page, limit, search: search || undefined } });
      setRows(data.data);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, [page]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchEmployees(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (emp) => { setEditing(emp); setModalOpen(true); };

  const handleDelete = async () => {
    try {
      await api.delete(`/employees/${deleteTarget.id}`);
      toast.success('Employee deactivated');
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate employee');
    }
  };

  const columns = useMemo(() => [
    { header: 'Name',   accessorKey: 'name' },
    { header: 'Mobile', accessorKey: 'mobile' },
    { header: 'Email',  accessorKey: 'email' },
    {
      header: 'Role', accessorKey: 'role',
      cell: ({ getValue }) => <span className={ROLE_BADGE[getValue()] || 'badge-primary'}>{roleLabel(getValue())}</span>,
    },
    {
      header: 'Status', accessorKey: 'is_active',
      cell: ({ getValue }) => getValue()
        ? <span className="badge-success">Active</span>
        : <span className="badge-danger">Inactive</span>,
    },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button className="action-btn-edit" onClick={() => openEdit(row.original)} aria-label="Edit">
            <Pencil size={14} />
          </button>
          {isSuperAdmin && row.original.id !== currentEmployee?.id && (
            <button className="action-btn-delete" onClick={() => setDeleteTarget(row.original)} aria-label="Deactivate">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [isSuperAdmin, currentEmployee]);

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-heading font-semibold">User Creation</h1>
          <p className="text-sm text-muted-foreground">Manage staff logins and roles</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="form-input pl-9"
              placeholder="Search name, email, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === 'list' && (
          <>
            <div className="table-wrapper border-0 rounded-none">
              <table className="table">
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => (
                        <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={columns.length} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={columns.length} className="text-center py-8 text-muted-foreground">No employees found</td></tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} itemLabel="employees" />
          </>
        )}
      </div>

      {view === 'grid' && (
        loading ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No employees found</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {rows.map(emp => (
                <GridCard
                  key={emp.id}
                  icon={emp.name?.[0]?.toUpperCase()}
                  iconColor={solidClass(emp.name)}
                  title={emp.name}
                  meta={emp.email}
                  badge={<span className={ROLE_BADGE[emp.role] || 'badge-primary'}>{roleLabel(emp.role)}</span>}
                  stats={[
                    { icon: <Phone size={14} />, value: emp.mobile, label: 'Mobile' },
                    { icon: <Activity size={14} />, value: emp.is_active ? <span className="badge-success">Active</span> : <span className="badge-danger">Inactive</span>, label: 'Status' },
                  ]}
                  menuItems={[
                    { label: 'Edit', icon: <Pencil size={14} />, onClick: () => openEdit(emp) },
                    isSuperAdmin && emp.id !== currentEmployee?.id && { label: 'Deactivate', icon: <Trash2 size={14} />, onClick: () => setDeleteTarget(emp), danger: true },
                  ]}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} itemLabel="employees" />
          </>
        )
      )}

      <EmployeeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        onSaved={() => { setModalOpen(false); fetchEmployees(); }}
      />

      <Modal open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Deactivate employee?">
        <p className="text-sm text-muted-foreground mb-4">
          {deleteTarget?.name} will no longer be able to log in. This can be reversed by editing their status back to Active.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete}>Deactivate</button>
        </div>
      </Modal>
    </div>
  );
}

function EmployeeFormModal({ open, onOpenChange, editing, onSaved }) {
  const isEdit = !!editing;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (open) {
      reset(isEdit
        ? { name: editing.name, email: editing.email, mobile: editing.mobile, role: editing.role, is_active: editing.is_active ? 'true' : 'false', password: '' }
        : { name: '', email: '', mobile: '', role: 'data_entry', is_active: 'true', password: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const onSubmit = async (form) => {
    const payload = {
      name: form.name, email: form.email, mobile: form.mobile,
      role: form.role, is_active: form.is_active === 'true',
    };
    if (form.password) payload.password = form.password;

    try {
      if (isEdit) {
        await api.put(`/employees/${editing.id}`, payload);
        toast.success('Employee updated');
      } else {
        if (!form.password) { toast.error('Password is required'); return; }
        await api.post('/employees', payload);
        toast.success('Employee created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save employee');
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEdit ? 'Edit Employee' : 'Add Employee'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="form-group">
          <label className="form-label-required">Name</label>
          <input className="form-input" {...register('name', { required: 'Name is required' })} />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-label-required">Email</label>
          <input type="email" className="form-input" {...register('email', { required: 'Email is required' })} />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-label-required">Mobile</label>
          <input className="form-input" {...register('mobile', { required: 'Mobile is required' })} />
          {errors.mobile && <p className="form-error">{errors.mobile.message}</p>}
        </div>

        <div className="form-group">
          <label className={isEdit ? 'form-label' : 'form-label-required'}>
            Password {isEdit && <span className="text-muted-foreground font-normal">(leave blank to keep unchanged)</span>}
          </label>
          <input type="password" className="form-input" {...register('password')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label-required">Role</label>
            <select className="form-select" {...register('role', { required: true })}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Settings2, X } from 'lucide-react';
import api from '../../../api/axios';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import PgCommercialsModal from './PgCommercialsModal';

const emptyForm = { payment_gateway: '', linked_account: '', transaction_category: 'non_utility', status: 'Active' };

export default function PgAccountsDrawer({ open, onOpenChange, vendor, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [commercialsFor, setCommercialsFor] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: emptyForm });

  const fetchAccounts = async () => {
    if (!vendor) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/vendors/${vendor.id}/pg-accounts`);
      setRows(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load payment gateways');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) { fetchAccounts(); setEditing(null); reset(emptyForm); } }, [open, vendor]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = (row) => {
    setEditing(row);
    reset({ payment_gateway: row.payment_gateway, linked_account: row.linked_account || '', transaction_category: row.transaction_category, status: row.status });
  };
  const cancelEdit = () => { setEditing(null); reset(emptyForm); };

  const onSubmit = async (form) => {
    try {
      if (editing) {
        await api.put(`/vendors/pg-accounts/${editing.id}`, form);
        toast.success('Payment gateway updated');
      } else {
        await api.post(`/vendors/${vendor.id}/pg-accounts`, form);
        toast.success('Payment gateway added');
      }
      cancelEdit();
      fetchAccounts();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save payment gateway');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/vendors/pg-accounts/${deleteTarget.id}`);
      toast.success('Payment gateway removed');
      setDeleteTarget(null);
      fetchAccounts();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete payment gateway');
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Payment Gateways" description={vendor?.name}>
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title text-sm">{editing ? 'Edit Payment Gateway' : 'Add New Payment Gateway'}</h3>
          {editing && <button className="action-btn-view" onClick={cancelEdit} aria-label="Cancel edit"><X size={14} /></button>}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label-required">Payment Gateway</label>
              <input className="form-input" placeholder='e.g. "PG 2"' {...register('payment_gateway', { required: 'Required' })} />
              {errors.payment_gateway && <p className="form-error">{errors.payment_gateway.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Linked Account</label>
              <input className="form-input" placeholder='e.g. "Pay Biz Wallet"' {...register('linked_account')} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label-required">Category</label>
              <select className="form-select" {...register('transaction_category', { required: true })}>
                <option value="non_utility">Non Utility</option>
                <option value="utility">Utility</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label-required">Status</label>
              <select className="form-select" {...register('status', { required: true })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editing ? 'Save Changes' : '+ Add New Payment Gateway'}
          </button>
        </form>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Payment Gateway</th>
              <th>Linked Account</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No payment gateways yet</td></tr>
            ) : (
              rows.map(row => (
                <tr key={row.id}>
                  <td>{row.payment_gateway}</td>
                  <td>{row.linked_account || '—'}</td>
                  <td><span className={row.transaction_category === 'utility' ? 'badge-info' : 'badge-secondary'}>{row.transaction_category === 'utility' ? 'Utility' : 'Non Utility'}</span></td>
                  <td>{row.status === 'Active' ? <span className="badge-success">Active</span> : <span className="badge-danger">Inactive</span>}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="action-btn-view" onClick={() => setCommercialsFor(row)} title="Commercials" aria-label="Commercials"><Settings2 size={14} /></button>
                      <button className="action-btn-edit" onClick={() => startEdit(row)} aria-label="Edit"><Pencil size={14} /></button>
                      <button className="action-btn-delete" onClick={() => setDeleteTarget(row)} aria-label="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Remove payment gateway?">
        <p className="text-sm text-muted-foreground mb-4">
          "{deleteTarget?.payment_gateway}" and its commercial rates will be permanently removed.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete}>Remove</button>
        </div>
      </Modal>

      <PgCommercialsModal open={!!commercialsFor} onOpenChange={(v) => !v && setCommercialsFor(null)} pgAccount={commercialsFor} />
    </Drawer>
  );
}

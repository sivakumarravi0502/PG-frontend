import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Pencil, Trash2, X } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';

const CARD_TYPES = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card',  label: 'Debit Card' },
  { value: 'upi',         label: 'UPI' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'wallet',      label: 'Wallet' },
];

const CARD_NETWORKS = [
  { value: 'visa', label: 'VISA' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'rupay', label: 'Rupay' },
  { value: 'amex', label: 'Amex' },
  { value: 'diner', label: 'Diner' },
  { value: 'business_corporate', label: 'Business/Corporate' },
  { value: 'other', label: 'Other' },
];

const typeLabel = (v) => CARD_TYPES.find(t => t.value === v)?.label || v;
const networkLabel = (v) => CARD_NETWORKS.find(n => n.value === v)?.label || v;

// customer_commercials and special_user_commercials share the exact same
// shape and UI — this one component drives both master pages.
export default function CommercialsPage({ endpoint, title, subtitle }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { card_type: 'credit_card', card_network: 'visa', is_utility: 'non_utility', charge: '' },
  });

  const fetchRows = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/commercials/${endpoint}`);
      setRows(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, [endpoint]);

  const startEdit = (row) => {
    setEditing(row);
    reset({ card_type: row.card_type, card_network: row.card_network, is_utility: row.is_utility, charge: row.charge });
  };

  const cancelEdit = () => {
    setEditing(null);
    reset({ card_type: 'credit_card', card_network: 'visa', is_utility: 'non_utility', charge: '' });
  };

  const onSubmit = async (form) => {
    const payload = { ...form, charge: parseFloat(form.charge) };
    try {
      if (editing) {
        await api.put(`/commercials/${endpoint}/${editing.id}`, payload);
        toast.success('Rate updated');
      } else {
        await api.post(`/commercials/${endpoint}`, payload);
        toast.success('Rate added');
      }
      cancelEdit();
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save rate');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/commercials/${endpoint}/${deleteTarget.id}`);
      toast.success('Rate deleted');
      setDeleteTarget(null);
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete rate');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-heading font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{editing ? 'Edit Rate' : 'Add Rate'}</h2>
            {editing && (
              <button className="action-btn-view" onClick={cancelEdit} aria-label="Cancel edit"><X size={14} /></button>
            )}
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-4">
            <div className="form-group">
              <label className="form-label-required">Card Mode</label>
              <select className="form-select" {...register('card_type', { required: true })}>
                {CARD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label-required">Card Type</label>
              <select className="form-select" {...register('card_network', { required: true })}>
                {CARD_NETWORKS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label-required">Is Utility</label>
              <select className="form-select" {...register('is_utility', { required: true })}>
                <option value="non_utility">Non Utility</option>
                <option value="utility">Utility</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label-required">Charge (%)</label>
              <input type="number" step="0.01" min="0" max="100" className="form-input"
                {...register('charge', { required: 'Charge is required', min: 0, max: 100 })} />
              {errors.charge && <p className="form-error">{errors.charge.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Add Rate'}
            </button>
          </form>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Card Mode</th>
                <th>Card Type</th>
                <th>Is Utility</th>
                <th>Charge</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No rates configured yet</td></tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id}>
                    <td>{typeLabel(row.card_type)}</td>
                    <td>{networkLabel(row.card_network)}</td>
                    <td>
                      <span className={row.is_utility === 'utility' ? 'badge-info' : 'badge-secondary'}>
                        {row.is_utility === 'utility' ? 'Utility' : 'Non Utility'}
                      </span>
                    </td>
                    <td>{parseFloat(row.charge).toFixed(2)}%</td>
                    <td>
                      <div className="flex items-center gap-1">
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
      </div>

      <Modal open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="Delete rate?">
        <p className="text-sm text-muted-foreground mb-4">
          {deleteTarget && `${typeLabel(deleteTarget.card_type)} / ${networkLabel(deleteTarget.card_network)}`} will be removed. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil } from 'lucide-react';
import api from '../api/axios';
import TransactionForm from '../components/transactions/TransactionForm';

export default function DataEntry() {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/transactions', { params: { page: 1, limit: 8 } });
      setRecent(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load recent transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecent(); }, []);

  const handleSaved = () => {
    setEditing(null);
    setFormKey(k => k + 1); // force the form to remount to a blank state for the next entry
    fetchRecent();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-heading font-semibold">Data Entry</h1>
        <p className="text-sm text-muted-foreground">Record a customer pay-in and its payout in one go</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{editing ? `Editing transaction #${editing.id}` : 'New Transaction'}</h2>
          {editing && <button className="btn-outline btn-sm" onClick={() => setEditing(null)}>New Transaction</button>}
        </div>
        <div className="card-body">
          <TransactionForm key={editing ? `edit-${editing.id}` : `new-${formKey}`} editing={editing} onSaved={handleSaved} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Transactions</h2>
        </div>
        <div className="table-wrapper border-0 rounded-none">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th><th>Customer</th><th>Amount</th><th>Vendor</th><th>Credited Amount</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : recent.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No transactions yet</td></tr>
              ) : (
                recent.map(t => (
                  <tr key={t.id}>
                    <td>{t.txn_date}</td>
                    <td>{t.customer_name}</td>
                    <td>₹{parseFloat(t.amount).toLocaleString('en-IN')}</td>
                    <td>{t.vendor_name}</td>
                    <td>₹{parseFloat(t.credited_amount).toLocaleString('en-IN')}</td>
                    <td>
                      {t.status === 'success' ? <span className="badge-success">Success</span>
                        : t.status === 'failed' ? <span className="badge-danger">Failed</span>
                        : <span className="badge-warning">Pending</span>}
                    </td>
                    <td>
                      <button className="action-btn-edit" onClick={() => setEditing(t)} aria-label="Edit"><Pencil size={14} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

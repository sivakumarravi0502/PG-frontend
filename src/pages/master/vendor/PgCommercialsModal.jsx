import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import Modal from '../../../components/ui/Modal';

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

const cellKey = (cardType, network) => `${cardType}__${network}`;

export default function PgCommercialsModal({ open, onOpenChange, pgAccount }) {
  const [grid, setGrid] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !pgAccount) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/vendors/pg-accounts/${pgAccount.id}/commercials`);
        const next = {};
        for (const t of CARD_TYPES) for (const n of CARD_NETWORKS) next[cellKey(t.value, n.value)] = { charge: '', with_gst: false, same_day: false };
        for (const row of data.data) {
          next[cellKey(row.card_type, row.card_network)] = { charge: row.charge, with_gst: row.with_gst, same_day: row.same_day };
        }
        setGrid(next);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load commercials');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, pgAccount]);

  const updateCell = (key, patch) => setGrid(g => ({ ...g, [key]: { ...g[key], ...patch } }));

  const save = async () => {
    setSaving(true);
    const rows = [];
    for (const t of CARD_TYPES) {
      for (const n of CARD_NETWORKS) {
        const key = cellKey(t.value, n.value);
        const cell = grid[key];
        if (cell && cell.charge !== '' && cell.charge !== null) {
          rows.push({ card_type: t.value, card_network: n.value, charge: parseFloat(cell.charge) || 0, with_gst: cell.with_gst, same_day: cell.same_day });
        }
      }
    }
    try {
      await api.put(`/vendors/pg-accounts/${pgAccount.id}/commercials`, { rows });
      toast.success('Commercials saved');
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save commercials');
    } finally {
      setSaving(false);
    }
  };

  const tabLabel = pgAccount?.transaction_category === 'utility' ? 'Utility MDR' : 'Non Utility MDR';

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Commercials — ${pgAccount?.payment_gateway || ''}`}
      description={tabLabel}
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
      ) : (
        <div className="max-h-[60vh] overflow-auto -mx-5 px-5">
          <table className="table">
            <thead>
              <tr>
                <th>Card Type</th>
                <th>Network</th>
                <th className="w-28">Charge %</th>
                <th className="w-20">GST</th>
                <th className="w-24">Same Day</th>
              </tr>
            </thead>
            <tbody>
              {CARD_TYPES.map(t => (
                CARD_NETWORKS.map((n, i) => {
                  const key = cellKey(t.value, n.value);
                  const cell = grid[key] || { charge: '', with_gst: false, same_day: false };
                  return (
                    <tr key={key}>
                      {i === 0 && <td rowSpan={CARD_NETWORKS.length} className="align-top font-medium">{t.label}</td>}
                      <td>{n.label}</td>
                      <td>
                        <input type="number" step="0.01" min="0" max="100" className="form-input py-1"
                          value={cell.charge} onChange={(e) => updateCell(key, { charge: e.target.value })} />
                      </td>
                      <td>
                        <input type="checkbox" className="w-4 h-4" checked={cell.with_gst}
                          onChange={(e) => updateCell(key, { with_gst: e.target.checked })} />
                      </td>
                      <td>
                        <input type="checkbox" className="w-4 h-4" checked={cell.same_day}
                          onChange={(e) => updateCell(key, { same_day: e.target.checked })} />
                      </td>
                    </tr>
                  );
                })
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button className="btn-outline" onClick={() => onOpenChange(false)}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={saving || loading}>
          {saving ? 'Saving...' : 'Save Commercials'}
        </button>
      </div>
    </Modal>
  );
}

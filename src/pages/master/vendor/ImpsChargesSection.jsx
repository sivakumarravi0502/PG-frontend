import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const RANGES = [
  { value: 'below_25k',   label: 'Below ₹25,000' },
  { value: '25k_to_50k',  label: '₹25,000 – ₹50,000' },
  { value: '50k_to_1l',   label: '₹50,000 – ₹1,00,000' },
  { value: 'above_1l',    label: 'Above ₹1,00,000' },
];

export default function ImpsChargesSection({ vendorId }) {
  const [tab, setTab] = useState('imps');
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/vendors/${vendorId}/transfer-charges`);
        const next = {};
        for (const r of data.data) next[`${r.transfer_type}__${r.amount_range}`] = r.charge;
        setValues(next);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load IMPS charges');
      } finally {
        setLoading(false);
      }
    })();
  }, [vendorId]);

  const setVal = (range, val) => setValues(v => ({ ...v, [`${tab}__${range}`]: val }));

  const save = async () => {
    setSaving(true);
    const rows = [];
    for (const transferType of ['imps', 'other']) {
      for (const r of RANGES) {
        const key = `${transferType}__${r.value}`;
        if (values[key] !== undefined && values[key] !== '') {
          rows.push({ transfer_type: transferType, amount_range: r.value, charge: parseFloat(values[key]) || 0 });
        }
      }
    }
    try {
      await api.put(`/vendors/${vendorId}/transfer-charges`, { rows });
      toast.success('IMPS charges saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save IMPS charges');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex border-b border-border">
        {['imps', 'other'].map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'imps' ? 'IMPS' : 'Other'}
          </button>
        ))}
      </div>
      <div className="p-4 space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : RANGES.map(r => (
          <div key={r.value} className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground flex-1">{r.label}</label>
            <input type="number" step="0.01" min="0" className="form-input w-32 py-1"
              value={values[`${tab}__${r.value}`] ?? ''}
              onChange={(e) => setVal(r.value, e.target.value)} />
          </div>
        ))}
        <div className="pt-2">
          <button type="button" className="btn-outline btn-sm" onClick={save} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save IMPS Charges'}
          </button>
        </div>
      </div>
    </div>
  );
}

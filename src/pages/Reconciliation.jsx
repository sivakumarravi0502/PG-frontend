import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Upload, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/ui/Modal';

const inr = (n) => n === null || n === undefined ? '—' : `₹${parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_BADGE = {
  matched: 'badge-success',
  amount_mismatch: 'badge-warning',
  not_found_in_app: 'badge-danger',
  not_found_in_ledger: 'badge-secondary',
};
const STATUS_LABEL = {
  matched: 'Matched',
  amount_mismatch: 'Amount Mismatch',
  not_found_in_app: 'Not Found in App',
  not_found_in_ledger: 'Not Found in Ledger',
};

export default function Reconciliation() {
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedImport, setSelectedImport] = useState(null);

  const fetchImports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reconciliation/imports');
      setImports(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load import history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImports(); }, []);

  if (selectedImport) {
    return <ImportResults importId={selectedImport} onBack={() => { setSelectedImport(null); fetchImports(); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-heading font-semibold">Reconciliation</h1>
          <p className="text-sm text-muted-foreground">Upload a PG ledger export and compare it against our transactions</p>
        </div>
        <button className="btn-primary" onClick={() => setUploadOpen(true)}><Upload size={16} /> Upload Ledger</button>
      </div>

      <div className="card">
        <div className="card-header"><h2 className="card-title">Import History</h2></div>
        <div className="table-wrapper border-0 rounded-none">
          <table className="table">
            <thead>
              <tr><th>File</th><th>Vendor</th><th>Date</th><th>Rows</th><th>Matched</th><th>Mismatched</th><th>Unmatched</th><th>Status</th><th>Uploaded By</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : imports.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">No ledgers uploaded yet</td></tr>
              ) : (
                imports.map(imp => (
                  <tr key={imp.id}>
                    <td className="font-medium"><FileSpreadsheet size={13} className="inline mr-1.5 -mt-0.5 text-muted-foreground" />{imp.file_name}</td>
                    <td>{imp.vendor_name}</td>
                    <td>{imp.import_date}</td>
                    <td>{imp.total_rows}</td>
                    <td className="text-success font-medium">{imp.matched_count}</td>
                    <td className="text-warning font-medium">{imp.mismatched_count}</td>
                    <td className="text-destructive font-medium">{imp.unmatched_count}</td>
                    <td>
                      {imp.status === 'completed' ? <span className="badge-success">Completed</span>
                        : imp.status === 'failed' ? <span className="badge-danger">Failed</span>
                        : <span className="badge-warning">Processing</span>}
                    </td>
                    <td>{imp.uploaded_by_name}</td>
                    <td><button className="btn-outline btn-sm" onClick={() => setSelectedImport(imp.id)}>View Results</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={(id) => { setUploadOpen(false); setSelectedImport(id); }} />
    </div>
  );
}

function UploadModal({ open, onOpenChange, onUploaded }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    if (open) {
      reset({ vendor_id: '', import_date: new Date().toISOString().slice(0, 10) });
      api.get('/vendors', { params: { status: 'Active', limit: 100 } }).then(({ data }) => setVendors(data.data)).catch(() => {});
    }
  }, [open, reset]);

  const onSubmit = async (form) => {
    if (!form.file?.[0]) { toast.error('Select a file to upload'); return; }
    const fd = new FormData();
    fd.append('vendor_id', form.vendor_id);
    fd.append('import_date', form.import_date);
    fd.append('file', form.file[0]);
    try {
      const { data } = await api.post('/reconciliation/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Compared ${data.data.total_rows} rows`);
      onUploaded(data.data.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process ledger');
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Upload PG Ledger">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="form-group">
          <label className="form-label-required">Vendor</label>
          <select className="form-select" {...register('vendor_id', { required: 'Required' })}>
            <option value="">Select vendor</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          {errors.vendor_id && <p className="form-error">{errors.vendor_id.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label-required">Date</label>
          <input type="date" className="form-input" {...register('import_date', { required: 'Required' })} />
        </div>
        <div className="form-group">
          <label className="form-label-required">File (.xlsx)</label>
          <input type="file" accept=".xlsx,.xls" className="form-input" {...register('file', { required: 'Required' })} />
          <p className="text-xs text-muted-foreground mt-1">Expected columns: EWalletTransactionID, MemberID, MemberName, Mobile, Amount, Credit, Debit, Factor, TransactionID, Narration, AddDate...</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={() => onOpenChange(false)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Comparing...' : 'Upload & Compare'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ImportResults({ importId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDetail = async () => {
    try {
      const { data } = await api.get(`/reconciliation/imports/${importId}`);
      setDetail(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load import');
    }
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reconciliation/imports/${importId}/rows`, { params: { limit: 200, match_status: statusFilter || undefined } });
      setRows(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load rows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [importId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchRows(); }, [importId, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // PG Commission = the linked settlement row's debit, looked up per payment_gateway row.
  const pairedDebit = useMemo(() => {
    const map = {};
    for (const r of rows) if (r.transaction_type === 'pg_settlement' && r.linked_pair_id) map[r.linked_pair_id] = r.debit;
    return map;
  }, [rows]);

  const counts = useMemo(() => {
    const c = { matched: 0, amount_mismatch: 0, not_found_in_app: 0, not_found_in_ledger: 0 };
    for (const s of detail?.status_counts || []) if (c[s.match_status] !== undefined) c[s.match_status] = s.count;
    return c;
  }, [detail]);

  const saveNotes = async (rowId, notes) => {
    try {
      await api.patch(`/reconciliation/rows/${rowId}/notes`, { notes });
      toast.success('Note saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save note');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button className="action-btn-view" onClick={onBack} aria-label="Back"><ArrowLeft size={16} /></button>
        <div>
          <h1 className="text-xl font-heading font-semibold">{detail?.file_name || 'Results'}</h1>
          <p className="text-sm text-muted-foreground">{detail?.vendor_name} · {detail?.import_date}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <SummaryCard label="Total Rows" value={detail?.total_rows ?? '—'} />
        <SummaryCard label="Matched" value={counts.matched} cls="text-success" />
        <SummaryCard label="Amount Mismatches" value={counts.amount_mismatch} cls="text-warning" />
        <SummaryCard label="Not Found in App" value={counts.not_found_in_app} cls="text-destructive" />
        <SummaryCard label="Not Found in Ledger" value={counts.not_found_in_ledger} cls="text-purple" />
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <h2 className="card-title">Results</h2>
          <select className="form-select w-full sm:w-52" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Rows</option>
            <option value="matched">Matched</option>
            <option value="amount_mismatch">Amount Mismatch</option>
            <option value="not_found_in_app">Not Found in App</option>
            <option value="not_found_in_ledger">Not Found in Ledger</option>
          </select>
        </div>
        <div className="table-wrapper border-0 rounded-none">
          <table className="table">
            <thead>
              <tr>
                <th>Txn ID</th><th>Member</th><th>Mobile</th><th>Credit</th><th>Debit</th><th>PG Commission</th>
                <th>Add Date</th><th>Our Txn</th><th>Our Amount</th><th>Difference</th><th>Match Status</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-8 text-muted-foreground">No rows</td></tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id}>
                    <td>
                      {r.transaction_id || <span className="text-muted-foreground">—</span>}
                      {r.transaction_type && <span className="text-[10px] text-muted-foreground block">{r.transaction_type === 'payment_gateway' ? 'PG' : 'Settlement'}</span>}
                    </td>
                    <td>{r.member_name}</td>
                    <td>{r.mobile}</td>
                    <td>{inr(r.credit)}</td>
                    <td>{inr(r.debit)}</td>
                    <td>{r.transaction_type === 'payment_gateway' ? inr(pairedDebit[r.id]) : '—'}</td>
                    <td>{r.add_date ? new Date(r.add_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td>{r.matched_transaction_id ? `#${r.matched_transaction_id}` : '—'}</td>
                    <td>{inr(r.our_amount)}</td>
                    <td className={r.difference_amount ? 'text-destructive font-semibold' : ''}>{r.difference_amount !== null ? inr(r.difference_amount) : '—'}</td>
                    <td>
                      {r.match_status ? <span className={STATUS_BADGE[r.match_status]}>{STATUS_LABEL[r.match_status]}</span> : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td><NotesCell value={r.notes} onSave={(v) => saveNotes(r.id, v)} /></td>
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

function SummaryCard({ label, value, cls = '' }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`font-heading font-bold text-xl mt-0.5 ${cls}`}>{value}</p>
    </div>
  );
}

function NotesCell({ value, onSave }) {
  const [text, setText] = useState(value || '');
  const [dirty, setDirty] = useState(false);
  return (
    <div className="flex items-center gap-1 min-w-[140px]">
      <input
        className="form-input py-1 text-xs"
        placeholder="Add note..."
        value={text}
        onChange={(e) => { setText(e.target.value); setDirty(true); }}
      />
      {dirty && (
        <button className="btn-outline btn-sm shrink-0" onClick={() => { onSave(text); setDirty(false); }}>Save</button>
      )}
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Search, GitMerge, CheckCircle2, Handshake, Users, Wallet, Clock } from 'lucide-react';
import api from '../api/axios';
import Drawer from '../components/ui/Drawer';
import ViewToggle from '../components/ui/ViewToggle';
import GridCard from '../components/ui/GridCard';
import Pagination from '../components/ui/Pagination';

const inr = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ReferralPartner() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [drillDown, setDrillDown] = useState(null);
  const [view, setView] = useState('list');
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/referrals/summary', { params: { search: search || undefined } });
      setRows(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load referral summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    const t = setTimeout(fetchSummary, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totalPages = Math.max(Math.ceil(rows.length / limit), 1);
  const pageRows = useMemo(() => rows.slice((page - 1) * limit, page * limit), [rows, page]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-heading font-semibold">Referral Partner</h1>
        <p className="text-sm text-muted-foreground">2-level MLM referral tree &amp; earnings per customer</p>
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="form-input pl-9" placeholder="Search customer name or code..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === 'list' && (
          <>
            <div className="table-wrapper border-0 rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th><th>Level 1 Referrals</th><th>Level 2 Referrals</th>
                    <th>Total Earned</th><th>Pending Payout</th><th>Paid Out</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                  ) : pageRows.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No referral partners yet</td></tr>
                  ) : (
                    pageRows.map(r => (
                      <tr key={r.customer_id}>
                        <td className="font-medium">{r.customer_name} <span className="text-muted-foreground font-normal">({r.customer_code})</span></td>
                        <td><span className="badge-info">{r.level1_count}</span></td>
                        <td><span className="badge-secondary">{r.level2_count}</span></td>
                        <td className="font-semibold">{inr(r.total_earned)}</td>
                        <td className="text-warning font-medium">{inr(r.pending_payout)}</td>
                        <td className="text-success font-medium">{inr(r.paid_out)}</td>
                        <td>
                          <button className="action-btn-view" onClick={() => setDrillDown(r)} title="View earnings" aria-label="View earnings">
                            <GitMerge size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={rows.length} limit={limit} onPageChange={setPage} itemLabel="referral partners" />
          </>
        )}
      </div>

      {view === 'grid' && (
        loading ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Loading...</p>
        ) : pageRows.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No referral partners yet</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {pageRows.map(r => {
                const totalEarned = parseFloat(r.total_earned) || 0;
                const paidOut = parseFloat(r.paid_out) || 0;
                return (
                  <GridCard
                    key={r.customer_id}
                    icon={<Handshake size={20} />}
                    iconColor="bg-purple text-white"
                    title={r.customer_name}
                    meta={r.customer_code}
                    badge={<span className="badge-info">L1: {r.level1_count}</span>}
                    stats={[
                      { icon: <Users size={14} />, value: r.level2_count, label: 'Level 2' },
                      { icon: <Wallet size={14} />, value: inr(totalEarned), label: 'Total Earned' },
                      { icon: <Clock size={14} />, value: <span className="text-warning">{inr(r.pending_payout)}</span>, label: 'Pending Payout' },
                      { icon: <CheckCircle2 size={14} />, value: <span className="text-success">{inr(paidOut)}</span>, label: 'Paid Out' },
                    ]}
                    progress={totalEarned > 0 ? { percent: (paidOut / totalEarned) * 100, label: 'Payout Progress', colorClass: 'bg-success' } : undefined}
                    menuItems={[
                      { label: 'View Earnings', icon: <GitMerge size={14} />, onClick: () => setDrillDown(r) },
                    ]}
                  />
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} total={rows.length} limit={limit} onPageChange={setPage} itemLabel="referral partners" />
          </>
        )
      )}

      <EarningsDrawer row={drillDown} onOpenChange={(v) => !v && setDrillDown(null)} onChanged={fetchSummary} />
    </div>
  );
}

function EarningsDrawer({ row, onOpenChange, onChanged }) {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEarnings = async () => {
    if (!row) return;
    setLoading(true);
    try {
      const { data } = await api.get('/referrals/earnings', { params: { beneficiary_customer_id: row.customer_id } });
      setEarnings(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEarnings(); }, [row]); // eslint-disable-line react-hooks/exhaustive-deps

  const markPaid = async (earning) => {
    try {
      await api.patch(`/referrals/earnings/${earning.id}/mark-paid`);
      toast.success('Marked as paid');
      fetchEarnings();
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark paid');
    }
  };

  const markAllPaid = async () => {
    try {
      const { data } = await api.patch(`/referrals/customer/${row.customer_id}/mark-all-paid`);
      toast.success(`${data.data.updated} earning(s) marked as paid`);
      fetchEarnings();
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark all paid');
    }
  };

  const hasPending = earnings.some(e => e.status === 'pending');

  return (
    <Drawer open={!!row} onOpenChange={onOpenChange} title="Referral Earnings" description={row?.customer_name} width="w-[560px]">
      <div className="flex justify-end mb-3">
        <button className="btn-outline btn-sm" onClick={markAllPaid} disabled={!hasPending}>Mark All Paid</button>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Source Customer</th><th>Level</th><th>%</th><th>Amount</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : earnings.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No earnings yet</td></tr>
            ) : (
              earnings.map(e => (
                <tr key={e.id}>
                  <td>{e.txn_date}</td>
                  <td>{e.source_customer_name}</td>
                  <td><span className={e.level === '1' ? 'badge-info' : 'badge-secondary'}>L{e.level}</span></td>
                  <td>{parseFloat(e.percentage).toFixed(2)}%</td>
                  <td className="font-medium">{inr(e.amount)}</td>
                  <td>{e.status === 'paid' ? <span className="badge-success">Paid</span> : <span className="badge-warning">Pending</span>}</td>
                  <td>
                    {e.status === 'pending' && (
                      <button className="action-btn-view" onClick={() => markPaid(e)} title="Mark Paid" aria-label="Mark Paid"><CheckCircle2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Drawer>
  );
}

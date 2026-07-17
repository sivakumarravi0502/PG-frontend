import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';
import toast from 'react-hot-toast';
import { IndianRupee, Wallet, TrendingUp, Clock, ArrowUp, ArrowDown, Sparkles, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const inr = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const inrShort = (n) => {
  n = parseFloat(n || 0);
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
};

const COLOR = { primary: '#bf1852', success: '#059669', warning: '#d97706', destructive: '#d1321a', info: '#0891b2', purple: '#7c3aed', muted: '#c7ccd4' };
const AVATAR_CLASSES = ['bg-primary/15 text-primary', 'bg-info/15 text-info', 'bg-success/15 text-success', 'bg-purple/15 text-purple', 'bg-warning/15 text-warning'];
const avatarClass = (name) => AVATAR_CLASSES[[...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_CLASSES.length];

const RANK_MEDALS = ['bg-warning text-white', 'bg-muted-foreground/70 text-white', 'bg-[#a15c2e] text-white'];

export default function Dashboard() {
  const { employee } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now] = useState(new Date());

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/dashboard');
      setData(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const markDuePaid = async (id) => {
    try {
      await api.patch(`/credit-card-dues/${id}/mark-paid`);
      toast.success('Marked as paid');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark paid');
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!data) return null;

  const statusTotal = data.status_breakdown.reduce((s, r) => s + r.count, 0);
  const pendingRatio = statusTotal ? (data.status_breakdown.find(r => r.status === 'pending')?.count || 0) / statusTotal : 0;
  const healthTag = statusTotal === 0 ? null : pendingRatio > 0.4 ? { label: 'NEEDS ATTENTION', cls: 'badge-warning' } : { label: 'HEALTHY', cls: 'badge-success' };

  const donutSeries = ['pending', 'success', 'failed'].map(s => data.status_breakdown.find(r => r.status === s)?.count || 0);
  const donutOptions = {
    chart: { type: 'donut', fontFamily: 'Nunito, sans-serif' },
    labels: ['Pending', 'Success', 'Failed'],
    colors: [COLOR.warning, COLOR.success, COLOR.destructive],
    legend: { position: 'bottom', fontWeight: 600 },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: { pie: { donut: { size: '72%', labels: {
      show: true,
      value: { fontSize: '22px', fontWeight: 700, color: '#202632' },
      total: { show: true, label: 'Total', fontSize: '12px', color: '#637288', formatter: () => statusTotal },
    } } } },
  };

  const trendCategories = data.trend.map(t => new Date(t.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
  const trendOptions = {
    chart: { type: 'line', toolbar: { show: false }, fontFamily: 'Nunito, sans-serif' },
    stroke: { width: [0, 3], curve: 'smooth' },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
    colors: [COLOR.muted, COLOR.primary],
    xaxis: { categories: trendCategories, labels: { style: { fontSize: '11px' } } },
    yaxis: [
      { title: { text: 'Amount' }, labels: { formatter: (v) => inrShort(v) } },
      { opposite: true, title: { text: 'Net Profit' }, labels: { formatter: (v) => inrShort(v) } },
    ],
    legend: { position: 'top', fontWeight: 600 },
    dataLabels: { enabled: false },
    grid: { borderColor: '#eef1f4' },
    tooltip: { y: { formatter: (v) => inr(v) } },
  };
  const trendSeries = [
    { name: 'Gross Amount', type: 'column', data: data.trend.map(t => parseFloat(t.amount)) },
    { name: 'Net Profit', type: 'line', data: data.trend.map(t => parseFloat(t.net_profit)) },
  ];

  return (
    <div className="space-y-3">
      {/* Row 1 — a greeting + 2x2 stat cluster sitting beside the two chart cards, all in one dense row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="space-y-3">
          <div className="card p-3 flex items-center gap-3 bg-gradient-to-br from-primary/8 to-transparent">
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0"><Sparkles size={15} /></div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground truncate">Good Day, {employee?.name?.split(' ')[0] || 'there'}!</p>
              <p className="text-[10px] text-muted-foreground">{now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard compact label="Pay-in Today" value={inrShort(data.today_payin)} change={data.today_payin_change} icon={<IndianRupee size={15} />} iconClass="stat-card-icon" />
            <StatCard compact label="Credited" value={inrShort(data.today_credited)} change={data.today_credited_change} icon={<Wallet size={15} />} iconClass="stat-card-icon-info" />
            <StatCard compact label="Net Profit" value={inrShort(data.today_net_profit)} change={data.today_net_profit_change} icon={<TrendingUp size={15} />} iconClass="stat-card-icon-success" />
            <StatCard compact label="Pending" value={data.pending_count} change={data.pending_count_change} icon={<Clock size={15} />} iconClass="stat-card-icon-warning" invert />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 className="card-title">Transaction Health</h2><span className="text-xs text-muted-foreground">30d</span></div>
          <div className="card-body flex flex-col items-center pt-2">
            {statusTotal === 0 ? (
              <p className="text-sm text-muted-foreground py-12">No transactions in the last 30 days</p>
            ) : (
              <>
                <Chart options={donutOptions} series={donutSeries} type="donut" height={190} />
                {healthTag && <span className={`${healthTag.cls} mt-1`}>{healthTag.label}</span>}
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">CC Dues</h2>
            <Link to="/credit-card-dues" className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:underline">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="card-body space-y-1">
            {data.upcoming_dues.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No pending dues</p>
            ) : (
              data.upcoming_dues.map(d => {
                const days = Math.round((new Date(d.due_date) - new Date(now.toDateString())) / 86400000);
                const urgency = days < 0 ? { label: 'Overdue', cls: 'badge-danger' }
                  : days === 0 ? { label: 'Today', cls: 'badge-danger' }
                  : days <= 3 ? { label: `${days}d`, cls: 'badge-warning' }
                  : { label: `${days}d`, cls: 'badge-neutral' };
                return (
                  <div key={d.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                    <div className="w-7 h-7 rounded-full bg-purple/15 text-purple flex items-center justify-center shrink-0"><CreditCard size={13} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{d.customer_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{d.card_bank} •••• {d.last_4_digit}</p>
                    </div>
                    <span className={urgency.cls}>{urgency.label}</span>
                    <button className="action-btn-view shrink-0" onClick={() => markDuePaid(d.id)} title="Mark Paid" aria-label="Mark Paid">
                      <CheckCircle2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row 2 — Top Customers (1/3) + Revenue Trend (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Top Customers</h2>
            <span className="text-xs text-muted-foreground">All time</span>
          </div>
          <div className="card-body space-y-1">
            {data.top_customers.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No transactions yet</p>
            ) : (
              data.top_customers.map((c, i) => (
                <div key={c.customer_id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i < 3 ? RANK_MEDALS[i] : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarClass(c.customer_name)}`}>
                    {c.customer_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{c.customer_name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.txn_count} txns</p>
                  </div>
                  <p className="font-semibold text-sm shrink-0">{inrShort(c.total_amount)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="card-header"><h2 className="card-title">Revenue Trend</h2><span className="text-xs text-muted-foreground">14d</span></div>
          <div className="card-body pt-2">
            <Chart options={trendOptions} series={trendSeries} type="line" height={250} />
          </div>
        </div>
      </div>

      {/* Row 3 — Recent Transactions (2/3) + Top Vendors (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card lg:col-span-2">
          <div className="card-header"><h2 className="card-title">Recent Transactions</h2></div>
          <div className="table-wrapper border-0 rounded-none">
            <table className="table">
              <thead><tr><th>Customer</th><th>Vendor</th><th>Amount</th><th>Credited</th><th>Net Profit</th><th>Status</th></tr></thead>
              <tbody>
                {data.recent_transactions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No transactions yet</td></tr>
                ) : (
                  data.recent_transactions.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarClass(t.customer_name)}`}>
                            {t.customer_name?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium truncate">{t.customer_name}</span>
                        </div>
                      </td>
                      <td>{t.vendor_name || '—'}</td>
                      <td>{inr(t.amount)}</td>
                      <td>{inr(t.credited_amount)}</td>
                      <td className="font-semibold text-primary">{inr(t.net_business_profit)}</td>
                      <td>
                        {t.status === 'success' ? <span className="badge-success">Success</span>
                          : t.status === 'failed' ? <span className="badge-danger">Failed</span>
                          : <span className="badge-warning">Pending</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 className="card-title">Top Vendors</h2><span className="text-xs text-muted-foreground">30d</span></div>
          <div className="card-body space-y-1">
            {data.top_vendors.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No data yet</p>
            ) : (
              data.top_vendors.map((v, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i < 3 ? RANK_MEDALS[i] : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{v.vendor_name || '—'}</p>
                    <p className="text-[11px] text-muted-foreground">{v.payment_gateway} · {v.txn_count} txns</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{inrShort(v.total_amount)}</p>
                    <p className="text-[11px] text-primary font-medium">{inrShort(v.total_net_profit)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, icon, iconClass, invert, compact }) {
  const rising = change >= 0;
  const good = invert ? !rising : rising;
  if (compact) {
    return (
      <div className="card p-3 flex flex-col justify-between">
        <div className={`${iconClass} !w-8 !h-8`}>{icon}</div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground truncate">{label}</p>
          <p className="font-heading font-bold text-base">{value}</p>
          {change !== undefined && (
            <p className={`text-[10px] font-semibold flex items-center gap-0.5 ${good ? 'text-success' : 'text-destructive'}`}>
              {rising ? <ArrowUp size={10} /> : <ArrowDown size={10} />} {Math.abs(change)}%
            </p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="stat-card">
      <div>
        <p className="stat-card-label">{label}</p>
        <p className="stat-card-value">{value}</p>
        {change !== undefined && (
          <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${good ? 'text-success' : 'text-destructive'}`}>
            {rising ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {Math.abs(change)}%
            <span className="text-muted-foreground font-normal">Since yesterday</span>
          </p>
        )}
      </div>
      <div className={iconClass}>{icon}</div>
    </div>
  );
}

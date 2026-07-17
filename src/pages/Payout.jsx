import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Search, Pencil, CheckCircle2, Wallet, TrendingUp, PiggyBank } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { solidClass } from '../lib/utils';
import Modal from '../components/ui/Modal';
import ViewToggle from '../components/ui/ViewToggle';
import GridCard from '../components/ui/GridCard';
import Pagination from '../components/ui/Pagination';
import TransactionForm from '../components/transactions/TransactionForm';

const inr = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Payout() {
  const { employee } = useAuthStore();
  const canEdit = ['super_admin', 'admin', 'data_entry'].includes(employee?.role);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState('list');

  const limit = 20;

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/transactions', {
        params: { page, limit, search: search || undefined, status: statusFilter || undefined },
      });
      setRows(data.data);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchTransactions(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openEdit = (row) => { setEditing(row); setModalOpen(true); };

  const markCredited = async (row) => {
    try {
      await api.patch(`/transactions/${row.id}/mark-credited`);
      toast.success('Marked as credited');
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark credited');
    }
  };

  const columns = useMemo(() => [
    { header: 'S.No', id: 'sno', cell: ({ row }) => (page - 1) * limit + row.index + 1 },
    { header: 'User Name', accessorKey: 'created_by_name' },
    { header: 'Customer', accessorKey: 'customer_name' },
    { header: 'Amount', accessorKey: 'amount', cell: ({ getValue }) => inr(getValue()) },
    {
      header: 'U/N', accessorKey: 'transaction_category',
      cell: ({ getValue }) => <span className={getValue() === 'utility' ? 'badge-info' : 'badge-secondary'}>{getValue() === 'utility' ? 'U' : 'N'}</span>,
    },
    { header: '%', accessorKey: 'fee_percentage', cell: ({ getValue }) => `${parseFloat(getValue()).toFixed(2)}%` },
    { header: 'Card Type', accessorKey: 'card_type', cell: ({ getValue }) => getValue()?.toUpperCase() },
    { header: 'Vendor', accessorKey: 'vendor_name' },
    { header: 'PG', accessorKey: 'payment_gateway' },
    { header: 'Credited Amount', accessorKey: 'credited_amount', cell: ({ getValue }) => inr(getValue()) },
    { header: 'IMPS Charge', accessorKey: 'imps_charge', cell: ({ getValue }) => inr(getValue()) },
    { header: 'Gross Margin', accessorKey: 'business_margin_amt', cell: ({ getValue }) => inr(getValue()) },
    {
      header: 'Net Profit', accessorKey: 'net_business_profit',
      cell: ({ getValue }) => <span className="font-semibold text-primary">{inr(getValue())}</span>,
    },
    { header: 'Pay Amount', accessorKey: 'pay_amount', cell: ({ getValue }) => inr(getValue()) },
    {
      header: 'Credited', accessorKey: 'credited',
      cell: ({ getValue }) => getValue() ? <span className="badge-success">Credited</span> : <span className="badge-neutral">Not Yet</span>,
    },
    {
      header: 'Status', accessorKey: 'status',
      cell: ({ getValue }) => getValue() === 'success' ? <span className="badge-success">Success</span>
        : getValue() === 'failed' ? <span className="badge-danger">Failed</span>
        : <span className="badge-warning">Pending</span>,
    },
    { header: 'Reason', accessorKey: 'reason', cell: ({ getValue }) => getValue() || 'NA' },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {canEdit && (
            <>
              <button className="action-btn-edit" onClick={() => openEdit(row.original)} aria-label="Edit"><Pencil size={14} /></button>
              {!row.original.credited && (
                <button className="action-btn-view" onClick={() => markCredited(row.original)} title="Mark Credited" aria-label="Mark Credited">
                  <CheckCircle2 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canEdit, page]);

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-heading font-semibold">Payout</h1>
        <p className="text-sm text-muted-foreground">Combined pay-in / pay-out view of every transaction</p>
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="form-input pl-9" placeholder="Search customer name, mobile, code..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select w-full sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
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
                    <tr><td colSpan={columns.length} className="text-center py-8 text-muted-foreground">No transactions found</td></tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} itemLabel="transactions" />
          </>
        )}
      </div>

      {view === 'grid' && (
        loading ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No transactions found</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {rows.map(t => (
                <GridCard
                  key={t.id}
                  icon={t.customer_name?.[0]?.toUpperCase()}
                  iconColor={solidClass(t.customer_name)}
                  title={t.customer_name}
                  meta={`${t.vendor_name} · ${t.payment_gateway}`}
                  badge={t.status === 'success' ? <span className="badge-success">Success</span> : t.status === 'failed' ? <span className="badge-danger">Failed</span> : <span className="badge-warning">Pending</span>}
                  stats={[
                    { icon: <Wallet size={14} />, value: inr(t.pay_amount), label: 'Pay Amount' },
                    { icon: <PiggyBank size={14} />, value: inr(t.credited_amount), label: 'Credited' },
                    { icon: <TrendingUp size={14} />, value: inr(t.net_business_profit), label: 'Net Profit' },
                    { icon: <CheckCircle2 size={14} />, value: t.credited ? <span className="badge-success">Credited</span> : <span className="badge-neutral">Not Yet</span>, label: 'Wallet' },
                  ]}
                  menuItems={canEdit ? [
                    { label: 'Edit', icon: <Pencil size={14} />, onClick: () => openEdit(t) },
                    !t.credited && { label: 'Mark Credited', icon: <CheckCircle2 size={14} />, onClick: () => markCredited(t) },
                  ] : []}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} itemLabel="transactions" />
          </>
        )
      )}

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={`Edit Transaction #${editing?.id || ''}`} maxWidth="max-w-4xl">
        {editing && (
          <TransactionForm
            editing={editing}
            onSaved={() => { setModalOpen(false); fetchTransactions(); }}
            onCancel={() => setModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}

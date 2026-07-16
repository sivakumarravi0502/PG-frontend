import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Users, ClipboardList, ArrowUpDown, GitMerge, CreditCard, BarChart3, Wallet, Settings, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { cn } from '../../lib/utils';
import logoIcon from '../../assets/logo-icon.png';

const NAV = [
  { path: '/',                 label: 'Dashboard',        icon: LayoutDashboard },
  { path: '/customers',        label: 'Customers',        icon: Users },
  { path: '/data-entry',       label: 'Data Entry',       icon: ClipboardList },
  { path: '/payout',           label: 'Payout',           icon: ArrowUpDown },
  { path: '/referral-partner', label: 'Referral Partner', icon: GitMerge },
  { path: '/credit-card-dues', label: 'Credit Card Dues', icon: CreditCard },
  { path: '/reconciliation',   label: 'Reconciliation',   icon: BarChart3 },
  { path: '/business-funds',   label: 'Business Funds',   icon: Wallet },
];

const MASTER = [
  { path: '/master/users',                    label: 'User Creation' },
  { path: '/master/vendors',                  label: 'Vendor' },
  { path: '/master/bank-accounts',            label: 'Bank Account' },
  { path: '/master/customer-commercials',     label: 'Customer Commercials' },
  { path: '/master/special-user-commercials', label: 'Special User Commercials' },
  { path: '/master/referral-rates',           label: 'Referral Commission Rates' },
];

export default function Sidebar() {
  const { employee, logout } = useAuthStore();
  const location = useLocation();
  const canMaster = ['super_admin','admin'].includes(employee?.role);
  const [masterOpen, setMasterOpen] = useState(MASTER.some(m => location.pathname.startsWith(m.path)));

  return (
    <aside className="w-60 min-h-screen bg-sidenav-bg border-r border-sidenav-border flex flex-col shrink-0">
      <div className="px-5 py-4 border-b border-sidenav-border flex items-center gap-2.5">
        <img src={logoIcon} alt="" className="w-8 h-8 shrink-0" />
        <div className="min-w-0">
          <h2 className="font-heading font-semibold text-sm text-white leading-tight truncate">Preferred Pay</h2>
          <p className="text-[11px] text-sidenav-item leading-tight">Payment Reconciliation</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/'}
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
              isActive ? 'bg-primary/15 text-sidenav-item-active font-medium' : 'text-sidenav-item hover:bg-white/5 hover:text-white'
            )}>
            <Icon size={16} />{label}
          </NavLink>
        ))}

        {canMaster && (
          <div className="pt-1">
            <button onClick={() => setMasterOpen(v => !v)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidenav-item hover:bg-white/5 hover:text-white transition-colors">
              <Settings size={16} />
              <span className="flex-1 text-left">Master</span>
              {masterOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {masterOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                {MASTER.map(({ path, label }) => (
                  <NavLink key={path} to={path}
                    className={({ isActive }) => cn(
                      'flex items-center px-3 py-1.5 rounded-md text-sm transition-colors',
                      isActive ? 'bg-primary/15 text-sidenav-item-active font-medium' : 'text-sidenav-item hover:bg-white/5 hover:text-white'
                    )}>
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-sidenav-border">
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-sidenav-item-active">
            {employee?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-white">{employee?.name}</p>
            <p className="text-xs text-sidenav-item capitalize">{employee?.role?.replace('_',' ')}</p>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-sidenav-item hover:bg-destructive/10 hover:text-destructive transition-colors">
          <LogOut size={14} />Sign out
        </button>
      </div>
    </aside>
  );
}

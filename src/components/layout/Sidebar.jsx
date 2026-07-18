import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Users, ClipboardList, ArrowUpDown, GitMerge, CreditCard, BarChart3, Wallet, Settings, ChevronDown, ChevronRight, LogOut, KeyRound, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { cn } from '../../lib/utils';
import logoFull from '../../assets/logo-full.png';
import ChangePasswordModal from './ChangePasswordModal';

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

export default function Sidebar({ mobileOpen, onClose }) {
  const { employee, logout } = useAuthStore();
  const location = useLocation();
  const canMaster = ['super_admin','admin'].includes(employee?.role);
  const [masterOpen, setMasterOpen] = useState(MASTER.some(m => location.pathname.startsWith(m.path)));
  const [pwOpen, setPwOpen] = useState(false);

  return (
    <>
      {/* Backdrop — mobile only, closes the drawer on tap outside */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={cn(
        'w-60 min-h-screen bg-sidenav-bg border-r-0 flex flex-col shrink-0',
        'fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out',
        'lg:static lg:translate-x-0 lg:z-auto',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="h-14 px-4 lg:px-6 bg-card border-b border-border flex items-center justify-between shrink-0">
          <img src={logoFull} alt="Preferred Pay" className="h-7 w-auto shrink-0" />
          <button onClick={onClose} className="lg:hidden p-1.5 -mr-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors shrink-0" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                isActive ? 'bg-nav-active/15 text-nav-active-text font-semibold' : 'text-sidenav-item font-medium hover:bg-white/5 hover:text-white'
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
                    <NavLink key={path} to={path} onClick={onClose}
                      className={({ isActive }) => cn(
                        'flex items-center px-3 py-1.5 rounded-md text-sm transition-colors',
                        isActive ? 'bg-nav-active/15 text-nav-active-text font-semibold' : 'text-sidenav-item font-medium hover:bg-white/5 hover:text-white'
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
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-sidenav-item-active shrink-0">
              {employee?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-white">{employee?.name}</p>
              <p className="text-xs text-sidenav-item capitalize">{employee?.role?.replace('_',' ')}</p>
            </div>
          </div>
          <button onClick={() => setPwOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-sidenav-item hover:bg-white/5 hover:text-white transition-colors">
            <KeyRound size={14} />Change Password
          </button>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-sidenav-item hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut size={14} />Sign out
          </button>
        </div>

        <ChangePasswordModal open={pwOpen} onOpenChange={setPwOpen} />
      </aside>
    </>
  );
}

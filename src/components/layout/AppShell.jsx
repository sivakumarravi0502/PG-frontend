import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import api from '../../api/axios';
import logoIcon from '../../assets/logo-icon.png';

export default function AppShell() {
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen]     = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/notifications?unread=true');
      setNotifs(data.notifications || []);
      setUnread(data.unread_count  || 0);
    } catch { /* silent */ }
  };

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    fetchNotifs();
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close the mobile drawer whenever the route changes (e.g. after tapping a nav link)
  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar mobileOpen={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setNavOpen(true)} className="p-2 -ml-2 rounded-md hover:bg-muted transition-colors" aria-label="Open menu">
              <Menu size={20} className="text-foreground" />
            </button>
            <img src={logoIcon} alt="" className="w-6 h-6" />
            <span className="font-heading font-bold text-sm">Preferred Pay</span>
          </div>
          <div className="hidden lg:block" />
          <div className="relative">
            <button onClick={() => setOpen(v => !v)}
              className="p-2 rounded-md hover:bg-muted transition-colors relative">
              <Bell size={18} className="text-muted-foreground" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-white text-[10px] flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {open && (
              <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-10 sm:w-80 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0
                    ? <p className="text-sm text-muted-foreground text-center py-8">No new notifications</p>
                    : notifs.map(n => (
                      <div key={n.id} onClick={() => markRead(n.id)}
                        className="px-4 py-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer">
                        <p className="text-sm">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto min-w-0 min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

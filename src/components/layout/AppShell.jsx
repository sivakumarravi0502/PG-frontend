import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import api from '../../api/axios';

export default function AppShell() {
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen]     = useState(false);

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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center justify-end px-6">
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
              <div className="absolute right-0 top-10 w-80 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
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
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiBell, HiCheck } from 'react-icons/hi2';
import api from '../services/api';
import { getSocket, reconnectSocketWithAuth } from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import type { AppNotification } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export default function NotificationBell() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setItems(res.data.data);
        setUnread(res.data.unreadCount ?? 0);
      }
    } catch {
      // silêncio
    }
  };

  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnread(0);
      return;
    }
    reconnectSocketWithAuth();
    load();

    const s = getSocket();
    const onNotification = (n: AppNotification) => {
      setItems((prev) => [n, ...prev].slice(0, 50));
      setUnread((u) => u + 1);
    };
    s.on('notification', onNotification);
    return () => {
      s.off('notification', onNotification);
    };
  }, [user]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border text-dark transition-colors hover:bg-muted-bg/80"
          aria-label="Notificações"
        >
          <HiBell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-dark text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[min(70vh,420px)] overflow-y-auto">
        <div className="px-2 py-1.5 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-dark">Notificações</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <HiCheck className="w-3 h-3" />
              Marcar todas lidas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-3 py-4 text-sm text-dark/60 text-center">Nenhuma notificação ainda.</p>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-stretch gap-1 cursor-default p-2"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex justify-between gap-2">
                <p className={`text-sm font-medium ${n.isRead ? 'text-dark/70' : 'text-dark'}`}>
                  {n.title}
                </p>
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="text-xs text-primary shrink-0 hover:underline"
                  >
                    Lida
                  </button>
                )}
              </div>
              <p className="text-xs text-dark/70 line-clamp-3">{n.message}</p>
              {n.caseId && (
                <Link
                  to={`/cases/${n.caseId}`}
                  className="text-xs text-primary font-medium hover:underline mt-1"
                  onClick={() => setOpen(false)}
                >
                  Ver caso
                </Link>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

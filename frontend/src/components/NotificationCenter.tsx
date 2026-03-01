'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, TrendingUp, TrendingDown, AlertTriangle, Check, Trash2 } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'watchlist' | 'analysis' | 'portfolio' | 'market';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  symbol?: string;
}

const STORAGE_KEY = 'stock-agent-notifications';

function loadNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveNotifications(items: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
}

export function addNotification(n: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
  const items = loadNotifications();
  const notification: Notification = {
    ...n,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  const updated = [notification, ...items].slice(0, 50);
  saveNotifications(updated);
  // Dispatch custom event for real-time updates
  window.dispatchEvent(new CustomEvent('notification-update'));
}

const ICON_MAP = {
  watchlist: { icon: TrendingUp, color: '#f59e0b' },
  analysis: { icon: Check, color: '#10b981' },
  portfolio: { icon: TrendingDown, color: '#3b82f6' },
  market: { icon: AlertTriangle, color: '#ef4444' },
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const reload = () => setNotifications(loadNotifications());

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener('notification-update', handler);
    // Poll every 30s
    const interval = setInterval(reload, 30000);
    return () => {
      window.removeEventListener('notification-update', handler);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const dismiss = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const clearAll = () => {
    setNotifications([]);
    saveNotifications([]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) reload(); }}
        className="relative p-2 rounded-xl transition-all"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl overflow-hidden animate-slideDown z-50"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-dropdown)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-divider)' }}>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs px-2 py-1 rounded-lg" style={{ color: 'var(--accent)' }}>
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="p-1 rounded-lg" style={{ color: 'var(--text-dimmed)' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-dimmed)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dimmed)' }}>
                  Alerts from your watchlist and analyses will appear here
                </p>
              </div>
            ) : (
              notifications.map(n => {
                const iconInfo = ICON_MAP[n.type];
                const Icon = iconInfo.icon;
                return (
                  <div
                    key={n.id}
                    className="px-4 py-3 flex gap-3 transition-colors"
                    style={{
                      background: n.read ? 'transparent' : 'var(--accent-muted)',
                      borderBottom: '1px solid var(--border-divider)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${iconInfo.color}15` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: iconInfo.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                          {n.title}
                        </p>
                        <button onClick={() => dismiss(n.id)} className="flex-shrink-0 p-0.5" style={{ color: 'var(--text-dimmed)' }}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-dimmed)' }}>{timeAgo(n.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

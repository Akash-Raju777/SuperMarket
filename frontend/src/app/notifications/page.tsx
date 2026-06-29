'use client';

import { useEffect, useState } from 'react';
import { api, Notification } from '@/lib/api';
import Link from 'next/link';
import { useSync } from '@/context/SyncContext';
import { 
  Bell, 
  Check, 
  AlertTriangle, 
  Calendar, 
  TrendingDown, 
  Sparkles,
  ShoppingBag,
  BellOff
} from 'lucide-react';

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    try {
      const res = await api.getNotifications();
      // Sort notifications with unread first, then latest timestamp
      const sorted = res.sort((a, b) => {
        if (a.readStatus !== b.readStatus) {
          return a.readStatus ? 1 : -1;
        }
        return b.timestamp.localeCompare(a.timestamp);
      });
      setNotifications(sorted);
    } catch (err) {
      console.error('Failed to load notifications feed', err);
    } finally {
      setLoading(false);
    }
  }

  const triggerSync = useSync('notifications', loadNotifications);
  useSync('products', loadNotifications);
  useSync('billing', loadNotifications);

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      // Update local state directly for instant snappy feedback
      setNotifications(notifications.map(n => 
        n.notificationId === id ? { ...n, readStatus: true } : n
      ));
      triggerSync('notifications');
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'EXPIRED':
        return {
          icon: AlertTriangle,
          borderColor: 'border-rose-500/20 bg-rose-500/5',
          iconColor: 'text-rose-400',
          title: 'Expired Batch Detected'
        };
      case 'LOW_STOCK':
      case 'OUT_OF_STOCK':
        return {
          icon: AlertTriangle,
          borderColor: 'border-amber-500/20 bg-amber-500/5',
          iconColor: 'text-amber-400',
          title: 'Inventory Stock Warning'
        };
      case 'EXPIRING_SOON':
        return {
          icon: Calendar,
          borderColor: 'border-yellow-500/20 bg-yellow-500/5',
          iconColor: 'text-yellow-400',
          title: 'Expiration Warning'
        };
      case 'SLOW_SALES_NEAR_EXPIRY':
        return {
          icon: TrendingDown,
          borderColor: 'border-indigo-500/20 bg-indigo-500/5',
          iconColor: 'text-indigo-400',
          title: 'Discount Action Recommended'
        };
      default:
        return {
          icon: Bell,
          borderColor: 'border-slate-800 bg-slate-900/50',
          iconColor: 'text-emerald-400',
          title: 'System Alert'
        };
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-400 text-sm font-medium">Loading Alert Feeds...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in text-slate-200">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-emerald-400" />
            Admin Notifications Center
          </h1>
          <p className="text-sm text-slate-400">Receive live alerts from inventory checks, expiration monitors, and sale turnover trackers.</p>
        </div>
        
        {unreadCount > 0 && (
          <span className="rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            {unreadCount} unread alerts active
          </span>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left: Feed listing */}
        <div className="md:col-span-2 space-y-4">
          {notifications.length > 0 ? (
            notifications.map((n, idx) => {
              const styles = getAlertStyles(n.type);
              const AlertIcon = styles.icon;
              return (
                <div 
                  key={idx} 
                  className={`rounded-xl border p-5 transition-all duration-300 relative flex flex-col justify-between ${styles.borderColor} ${
                    n.readStatus ? 'opacity-50 hover:opacity-75' : 'shadow-md shadow-slate-950/20'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`rounded-lg bg-white/5 p-2.5 h-10 w-10 flex items-center justify-center shrink-0 ${styles.iconColor}`}>
                      <AlertIcon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{styles.title}</span>
                        {!n.readStatus && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed pr-8">{n.message}</p>
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-slate-500 font-mono">
                        <span>SKU ID: {n.productId}</span>
                        <span>•</span>
                        <span>{n.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Action Buttons */}
                  <div className="flex gap-4 items-center justify-end mt-4 pt-3 border-t border-white/5">
                    {/* Expiry alerts can direct cashier to create promo */}
                    {(n.type === 'SLOW_SALES_NEAR_EXPIRY' || n.type === 'EXPIRING_SOON') && (
                      <Link
                        href={`/offers?productId=${n.productId}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 transition-all"
                      >
                        Create Promo Offer
                      </Link>
                    )}

                    {!n.readStatus && (
                      <button
                        onClick={() => handleMarkAsRead(n.notificationId)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Acknowledge</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-white/5 bg-slate-900/10 py-16 text-center text-slate-500 flex flex-col items-center justify-center">
              <BellOff className="h-12 w-12 text-slate-700 stroke-[1.5] mb-3" />
              <h3 className="font-bold text-slate-300 mb-1">No alerts registered</h3>
              <p className="text-sm text-slate-500 max-w-xs">Everything is safe. Expiry trackers and stock levels are within normal parameters.</p>
            </div>
          )}
        </div>

        {/* Right: Side status card */}
        <div className="space-y-6">
          <div className="rounded-xl border border-white/5 bg-slate-900/30 p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white tracking-wide border-b border-white/5 pb-2.5">Alert Audit Summary</h2>
            <div className="space-y-3.5 text-sm text-slate-400">
              <div className="flex justify-between items-center">
                <span>Total Registered alerts</span>
                <span className="font-mono text-white font-bold">{notifications.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Active (Unread) alerts</span>
                <span className="font-mono text-rose-400 font-bold">{unreadCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Acknowledged alerts</span>
                <span className="font-mono text-emerald-400 font-bold">{notifications.length - unreadCount}</span>
              </div>
            </div>
            
            <div className="border-t border-white/5 pt-4">
              <div className="flex gap-2 items-center text-xs text-slate-500 bg-white/5 p-3 rounded-lg leading-relaxed">
                <Sparkles className="h-4 w-4 stroke-[2] text-amber-400 shrink-0" />
                <span>Alerts auto-refresh when POS transactions complete, or when products are loaded.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

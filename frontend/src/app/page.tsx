'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, DashboardStats, AnalyticsData } from '@/lib/api';
import { 
  ShoppingCart, 
  Package, 
  Tag, 
  BarChart3, 
  Bell, 
  AlertTriangle, 
  DollarSign, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    expiredProducts: 0,
    expiringSoonProducts: 0
  });
  const [analytics, setAnalytics] = useState<Partial<AnalyticsData>>({
    totalRevenue: 0,
    totalOrders: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [productStats, dashboardAnalytics] = await Promise.all([
          api.getProductStats(),
          api.getAnalytics()
        ]);
        setStats(productStats);
        setAnalytics(dashboardAnalytics);
      } catch (error) {
        console.error('Failed to load dashboard metrics', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const statsCards = [
    { 
      name: 'Total Revenue', 
      value: `$${analytics.totalRevenue?.toLocaleString() || '0.00'}`, 
      description: 'Calculated from checked out bills', 
      icon: DollarSign, 
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400' 
    },
    { 
      name: 'Active Inventory Items', 
      value: stats.totalProducts, 
      description: `${analytics.lowStockCount || 0} low stock items`, 
      icon: Package, 
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400' 
    },
    { 
      name: 'Expired Products', 
      value: stats.expiredProducts, 
      description: 'Require immediate removal', 
      icon: AlertTriangle, 
      color: stats.expiredProducts > 0 
        ? 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400' 
        : 'from-slate-500/20 to-slate-600/20 border-slate-700 text-slate-400' 
    },
    { 
      name: 'Expiring Soon', 
      value: stats.expiringSoonProducts, 
      description: 'Approaching expiry (30 days)', 
      icon: Bell, 
      color: stats.expiringSoonProducts > 0 
        ? 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400' 
        : 'from-slate-500/20 to-slate-600/20 border-slate-700 text-slate-400' 
    }
  ];

  const quickLinks = [
    { name: 'POS Billing Terminal', desc: 'Process cashier sales & apply active offers.', href: '/billing', icon: ShoppingCart, color: 'hover:border-emerald-500/50 hover:bg-emerald-500/5' },
    { name: 'Product Inventory Board', desc: 'Add/edit goods, view images & track expiry dates.', href: '/products', icon: Package, color: 'hover:border-blue-500/50 hover:bg-blue-500/5' },
    { name: 'Offers Management Hub', desc: 'Promote slow-moving stock with discount campaigns.', href: '/offers', icon: Tag, color: 'hover:border-amber-500/50 hover:bg-amber-500/5' },
    { name: 'Analytics & Trends Chart', desc: 'Analyze daily sales trends and product velocities.', href: '/analytics', icon: BarChart3, color: 'hover:border-purple-500/50 hover:bg-purple-500/5' },
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-400 text-sm font-medium">Loading management systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative mb-10 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-8 shadow-xl">
        <div className="absolute right-10 top-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute left-1/2 bottom-0 h-20 w-80 rounded-full bg-blue-500/10 blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">AWS Cloud Hackathon</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              FreshMart Control Panel
            </h1>
            <p className="mt-2 text-slate-400 max-w-xl">
              Supermarket management terminal. Instantly process transactions, track product lifetimes, trigger stock alerts, and deploy promo offers.
            </p>
          </div>
          <div>
            <Link 
              href="/billing" 
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
            >
              <span>Open Cashier POS</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {statsCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              className={`rounded-xl border bg-gradient-to-b p-6 shadow-sm transition-all duration-300 ${card.color}`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-slate-400">{card.name}</p>
                <div className="rounded-lg bg-white/5 p-2">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold tracking-tight text-white">{card.value}</p>
                <p className="mt-1 text-xs text-slate-400">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Launchpad & Alerts Board */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Launchpad links */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white tracking-wide">Quick Navigation</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickLinks.map((link, i) => {
              const Icon = link.icon;
              return (
                <Link
                  key={i}
                  href={link.href}
                  className={`flex flex-col p-6 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm transition-all duration-300 hover:translate-y-[-2px] ${link.color}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-200">{link.name}</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed flex-1">
                    {link.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Live Status Summary Card */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white tracking-wide">Live Status Board</h2>
          <div className="rounded-xl border border-white/5 bg-slate-900/30 p-6 space-y-5">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Safe (🟢)</span>
                <span>{stats.totalProducts - stats.expiredProducts - stats.expiringSoonProducts} / {stats.totalProducts}</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${stats.totalProducts > 0 ? ((stats.totalProducts - stats.expiredProducts - stats.expiringSoonProducts) / stats.totalProducts) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Near Expiry (🟡)</span>
                <span>{stats.expiringSoonProducts} / {stats.totalProducts}</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500" 
                  style={{ width: `${stats.totalProducts > 0 ? (stats.expiringSoonProducts / stats.totalProducts) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Expired (🔴)</span>
                <span>{stats.expiredProducts} / {stats.totalProducts}</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500" 
                  style={{ width: `${stats.totalProducts > 0 ? (stats.expiredProducts / stats.totalProducts) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg bg-slate-950/50 p-3 border border-white/5">
                <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Out of Stock</span>
                <span className="text-xl font-bold text-rose-400">{analytics.outOfStockCount || 0}</span>
              </div>
              <div className="rounded-lg bg-slate-950/50 p-3 border border-white/5">
                <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Low Stock</span>
                <span className="text-xl font-bold text-amber-400">{analytics.lowStockCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

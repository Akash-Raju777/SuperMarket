'use client';

import { useEffect, useState } from 'react';
import { api, AnalyticsData } from '@/lib/api';
import { useSync } from '@/context/SyncContext';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendType, setTrendType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  async function loadAnalytics() {
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics metrics', err);
    } finally {
      setLoading(false);
    }
  }

  useSync('products', loadAnalytics);
  useSync('billing', loadAnalytics);

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-400 text-sm font-medium">Computing Sales Intelligence...</p>
        </div>
      </div>
    );
  }

  // Formatting trend data based on user filter selection
  const getTrendData = () => {
    switch (trendType) {
      case 'weekly':
        return data.weeklyTrend.map(t => ({ name: t.week, Revenue: t.revenue }));
      case 'monthly':
        return data.monthlyTrend.map(t => ({ name: t.month, Revenue: t.revenue }));
      case 'daily':
      default:
        return data.dailyTrend.map(t => ({ name: t.date, Revenue: t.revenue }));
    }
  };

  // Pie chart data
  const pieData = [
    { name: 'Safe (🟢)', value: data.inventoryBreakdown.safe, color: '#10b981' },
    { name: 'Near Expiry (🟡)', value: data.inventoryBreakdown.nearExpiry, color: '#f59e0b' },
    { name: 'Expired (🔴)', value: data.inventoryBreakdown.expired, color: '#f43f5e' }
  ].filter(d => d.value > 0);

  // Top Sellers data
  const topSellersData = data.topSellers.map(s => ({
    name: s.productName.length > 15 ? s.productName.substring(0, 15) + '...' : s.productName,
    Quantity: s.quantitySold,
    Revenue: s.revenue
  }));

  const kpis = [
    { name: 'Total Revenue', value: `$${data.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { name: 'Bills Processed', value: data.totalOrders, icon: ShoppingBag, color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
    { name: 'Average Ticket Value', value: `$${data.averageOrderValue.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
    { name: 'Low/Out Stock Alerts', value: data.lowStockCount + data.outOfStockCount, icon: AlertTriangle, color: 'text-rose-400 border-rose-500/20 bg-rose-500/5' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in text-slate-200">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-emerald-400" />
          Product Sales & Inventory Analytics
        </h1>
        <p className="text-sm text-slate-400">Track best-sellers, slow-moving items, revenue curves, and stock shelf life profiles.</p>
      </div>

      {/* Analytics KPI cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`rounded-xl border p-6 flex justify-between items-center shadow-lg ${kpi.color}`}>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">{kpi.name}</span>
                <span className="text-2xl font-extrabold text-white mt-1.5 block">{kpi.value}</span>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* First Row Charts */}
      <div className="grid gap-8 lg:grid-cols-3 mb-8">
        {/* Line Chart: Revenue trends */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-slate-900/30 p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-white tracking-wide">Revenue Performance Curves</h2>
            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-950 p-1">
              <button 
                onClick={() => setTrendType('daily')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  trendType === 'daily' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Daily
              </button>
              <button 
                onClick={() => setTrendType('weekly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  trendType === 'weekly' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setTrendType('monthly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  trendType === 'monthly' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="h-72 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getTrendData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#f8fafc' }} />
                <Legend />
                <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Inventory Status Breakdown */}
        <div className="rounded-xl border border-white/5 bg-slate-900/30 p-6 shadow-xl">
          <h2 className="text-base font-bold text-white tracking-wide mb-6">Live Shelf Life Board</h2>
          {pieData.length > 0 ? (
            <div className="h-72 w-full flex flex-col justify-between items-center text-xs">
              <ResponsiveContainer width="100%" height="70%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full grid grid-cols-3 gap-2 text-center pt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="h-2.5 w-2.5 rounded-full mb-1" style={{ backgroundColor: d.color }}></span>
                    <span className="text-[10px] text-slate-400 block">{d.name}</span>
                    <strong className="text-sm text-slate-200 mt-0.5">{d.value} items</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-72 w-full flex items-center justify-center text-slate-500">
              No inventory data registered.
            </div>
          )}
        </div>
      </div>

      {/* Second Row Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Bar Chart: Best-Sellers */}
        <div className="rounded-xl border border-white/5 bg-slate-900/30 p-6 shadow-xl">
          <h2 className="text-base font-bold text-white tracking-wide mb-6">Top-Selling Products by Quantity</h2>
          {topSellersData.length > 0 ? (
            <div className="h-72 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSellersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#f8fafc' }} />
                  <Legend />
                  <Bar dataKey="Quantity" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 w-full flex items-center justify-center text-slate-500">
              No sales transactions processed yet.
            </div>
          )}
        </div>

        {/* List Table: Slow-Moving items */}
        <div className="rounded-xl border border-white/5 bg-slate-900/30 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide mb-6">Slow-Moving Stock Inventory (Needs discounting)</h2>
            {data.slowMovers.length > 0 ? (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 pb-2">
                      <th className="pb-3 font-semibold">Product Name</th>
                      <th className="pb-3 font-semibold">SKU ID</th>
                      <th className="pb-3 font-semibold text-right">Units Sold (Recent)</th>
                      <th className="pb-3 font-semibold text-right">In Stock Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slowMovers.map((sm, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3">
                          <span className="font-bold text-slate-200 block">{sm.productName}</span>
                          <span className="text-[10px] text-slate-500">{sm.brand}</span>
                        </td>
                        <td className="py-3 font-mono text-slate-400">{sm.productId}</td>
                        <td className="py-3 text-right text-amber-400 font-bold">{sm.quantitySold} units</td>
                        <td className="py-3 text-right text-slate-300 font-bold">{sm.quantityInStock} left</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                No items matching.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

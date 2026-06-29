'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSync } from '@/context/SyncContext';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Package, 
  Tag, 
  BarChart3, 
  Bell,
  Menu,
  X,
  LayoutDashboard,
  Layers,
  Calendar,
  Settings,
  User,
  LogOut,
  Database,
  ShieldCheck,
  Server
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const data = await api.getUnreadNotificationsCount();
      if (data && typeof data.count === 'number') {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.warn('Unable to query notifications count:', error);
    }
  };

  useSync('notifications', fetchUnreadCount);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
    const interval = setInterval(() => {
      if (user) {
        fetchUnreadCount();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (pathname === '/login') {
    return null;
  }

  const isCashier = user?.role === 'cashier';

  // Desktop/Mobile main list
  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'POS Billing', href: '/billing', icon: ShoppingCart },
    ...(!isCashier ? [
      { name: 'Inventory & Expiry', href: '/products', icon: Package },
      { name: 'Offers Management', href: '/offers', icon: Tag },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Alerts', href: '/notifications', icon: Bell, badge: true }
    ] : [])
  ];

  // Mobile list including separate virtual links to fulfill prompt exactly
  const mobileMenuLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package, adminOnly: true },
    { name: 'Billing', href: '/billing', icon: ShoppingCart },
    { name: 'Inventory', href: '/products', icon: Layers, adminOnly: true },
    { name: 'Offers', href: '/offers', icon: Tag, adminOnly: true },
    { name: 'Expiry Tracker', href: '/products', icon: Calendar, adminOnly: true },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, adminOnly: true },
    { name: 'Alerts', href: '/notifications', icon: Bell, badge: true, adminOnly: true },
  ];

  const handleLogout = () => {
    logout();
    setIsDrawerOpen(false);
    setIsProfileOpen(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-md text-slate-100">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-emerald-400 hover:text-emerald-300 transition-colors">
            <ShoppingBag className="h-6 w-6 stroke-[2.5]" />
            <span>FreshMart</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  {item.badge && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Quick Settings & Profile */}
        <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="System Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 animate-fade-in"
            title="Profile Details"
          >
            <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
              {user?.username?.substring(0, 2) || 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-300">{user?.name || 'User'}</span>
          </button>
        </div>

        {/* Mobile Header Controls */}
        <div className="flex md:hidden items-center gap-1">
          <Link href="/notifications" className="relative p-2 text-slate-400 hover:text-white transition-colors">
            <Bell className="h-5.5 w-5.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="h-5.5 w-5.5" />
          </button>

          <button 
            onClick={() => setIsProfileOpen(true)}
            className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Profile"
          >
            <User className="h-5.5 w-5.5" />
          </button>

          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Open Menu"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
        </div>
      </div>

      {/* Slide-out Mobile Side Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in md:hidden">
          <div className="w-80 h-full bg-slate-950 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl animate-slide-in">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Navigation Menu</span>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="space-y-1">
                {mobileMenuLinks.map((item) => {
                  if (item.adminOnly && isCashier) return null;
                  
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className={`relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 border ${
                        isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      <span>{item.name}</span>
                      {item.badge && unreadCount > 0 && (
                        <span className="absolute right-4 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer User Details */}
            <div className="border-t border-white/5 pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm uppercase">
                  {user?.username?.substring(0, 2) || 'U'}
                </div>
                <div>
                  <span className="font-bold text-white text-sm block truncate max-w-[180px]">{user?.name || 'User'}</span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">{user?.role} Account</span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-slate-950 py-3 text-sm font-semibold border border-rose-500/20 transition-all cursor-pointer animate-fade-in"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 text-slate-300 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-emerald-400" />
                <span>Terminal System Settings</span>
              </h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-sm">
              <div className="rounded-xl border border-white/5 bg-slate-900/20 p-4 space-y-3.5">
                <div className="flex items-center gap-2.5 text-slate-200">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold">PostgreSQL (AWS RDS) Connection</span>
                </div>
                <div className="text-xs text-slate-400 space-y-2.5 font-mono">
                  <div className="flex justify-between">
                    <span>Host:</span>
                    <span className="text-slate-200 text-right truncate max-w-[200px]">database-1.cluster-cp8iq8km4wn9.ap-northeast-3.rds.amazonaws.com</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>DB Port:</span>
                    <span className="text-slate-200">5432</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Active Profile:</span>
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1 py-0.5 font-bold uppercase tracking-wider text-[9px]">AWS RDS (Postgres)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-slate-900/20 p-4 space-y-3.5">
                <div className="flex items-center gap-2.5 text-slate-200">
                  <Server className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold">Integration Details</span>
                </div>
                <div className="text-xs text-slate-400 space-y-2.5 font-mono">
                  <div className="flex justify-between">
                    <span>API Server Base:</span>
                    <span className="text-emerald-400 truncate max-w-[200px]">{api.getBaseUrl()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Multi-Tenancy Mode:</span>
                    <span className="text-slate-200 font-bold uppercase tracking-wider text-[9px]">Header-Based (X-Business-Owner)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-white/5 bg-slate-900/30 flex justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 text-slate-300 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50">
              <h2 className="font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-400" />
                <span>Operator Profile</span>
              </h2>
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 text-center space-y-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-2xl uppercase">
                {user?.username?.substring(0, 2) || 'U'}
              </div>
              
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base leading-snug">{user?.name || 'User'}</h3>
                <span className="text-xs text-slate-400 font-mono block">Username: {user?.username}</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">{user?.role} Account</span>
              </div>

              <div className="rounded-xl border border-white/5 bg-slate-900/20 p-4 flex items-center justify-between text-xs font-mono text-left">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Tenant ID (Business):</span>
                </div>
                <strong className="text-emerald-400 font-semibold">{user?.businessName || 'default'}</strong>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-white/5 bg-slate-900/30 flex gap-3">
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="flex-1 rounded-lg border border-slate-700 hover:bg-white/5 py-2 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 rounded-lg bg-rose-500 hover:bg-rose-600 py-2 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

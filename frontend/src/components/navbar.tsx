'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Package, 
  Tag, 
  BarChart3, 
  Bell 
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const data = await api.getUnreadNotificationsCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to fetch unread notification count', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll for notifications every 10 seconds (dynamic live update)
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'POS & Expiry', href: '/', icon: ShoppingBag },
    { name: 'POS Billing', href: '/billing', icon: ShoppingCart },
    { name: 'Inventory & Expiry', href: '/products', icon: Package },
    { name: 'Offers Management', href: '/offers', icon: Tag },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Alerts', href: '/notifications', icon: Bell, badge: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-md text-slate-100">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-emerald-400 hover:text-emerald-300 transition-colors">
            <ShoppingBag className="h-6 w-6 stroke-[2.5]" />
            <span>FreshMart</span>
          </Link>

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

        {/* Mobile quick indicator */}
        <div className="flex md:hidden items-center gap-3">
          <Link href="/notifications" className="relative p-2 text-slate-400 hover:text-white">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

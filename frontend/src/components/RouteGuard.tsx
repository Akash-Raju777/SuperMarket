"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    if (!isAuthenticated) {
      if (pathname !== "/login") {
        router.push("/login");
      }
    } else {
      // Role checks for Cashier (block admin routes)
      if (user?.role === "cashier") {
        const adminPaths = ["/products", "/offers", "/analytics", "/notifications"];
        if (adminPaths.includes(pathname)) {
          router.push("/billing");
        }
      }
      // If visiting login while authenticated, redirect to POS Billing
      if (pathname === "/login") {
        router.push("/billing");
      }
    }
  }, [isAuthenticated, loading, pathname, router, user, mounted]);

  // Server render & initial client hydration: return children to prevent mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <span className="text-sm font-medium text-slate-400">Loading terminal state...</span>
        </div>
      </div>
    );
  }

  const isLoginPage = pathname === "/login";

  // Prevent flash of protected content during redirect
  if (!isAuthenticated && !isLoginPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (isAuthenticated && user?.role === "cashier") {
    const adminPaths = ["/products", "/offers", "/analytics", "/notifications"];
    if (adminPaths.includes(pathname)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      );
    }
  }

  return <>{children}</>;
}

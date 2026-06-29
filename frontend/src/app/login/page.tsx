"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ShoppingBag, Lock, User, AlertCircle, Loader2, Store } from "lucide-react";

export default function LoginPage() {
  const { login, register, isAuthenticated, loading: authLoading, isServerHealthy } = useAuth();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to POS Billing
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/billing");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isSignUp) {
      if (!businessName.trim() || !username.trim() || !password.trim()) {
        setError("Please fill in all fields to register your business.");
        return;
      }
      setLoading(true);
      try {
        await register(businessName, username, password);
        setSuccess("Business registered successfully! You can now sign in.");
        setIsSignUp(false);
        setPassword("");
      } catch (err: any) {
        setError(err.message || "Registration failed.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!username.trim() || !password.trim()) {
        setError("Please fill in all fields.");
        return;
      }
      setLoading(true);
      try {
        await login(username, password);
        router.push("/billing");
      } catch (err: any) {
        setError(err.message || "Failed to log in.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuickLogin = async (role: "admin" | "cashier") => {
    setLoading(true);
    setError("");
    setSuccess("");
    setUsername(role);
    setPassword("password123");

    try {
      await login(role, "password123");
      router.push("/billing");
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <span className="text-sm font-medium text-slate-400">Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/30 p-8 shadow-2xl backdrop-blur-md space-y-6 animate-fade-in">
        {/* Decorative Top Glow */}
        <div className="absolute -top-12 left-1/2 h-24 w-48 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-2xl" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShoppingBag className="h-6 w-6 stroke-[2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isSignUp ? "Register Business" : "Terminal Login"}
          </h1>
          <p className="text-sm text-slate-400">
            {isSignUp
              ? "Sign up your supermarket and seed your inventory"
              : "Sign in to your FreshMart terminal account"}
          </p>
        </div>

        {/* Status Alerts */}
        {!isServerHealthy && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400 animate-pulse">
            <AlertCircle className="h-4 w-4 shrink-0 animate-spin" />
            <span>Server is temporarily unavailable. Retrying...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Unified Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Name Field (Sign Up Only) */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-slate-500" />
                Business / Supermarket Name
              </label>
              <input
                type="text"
                placeholder="e.g. FreshMart Premium"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-all"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-500" />
              Username
            </label>
            <input
              type="text"
              placeholder="Choose a username"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              Password
            </label>
            <input
              type="password"
              placeholder="Choose a password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                {isSignUp ? "Registering..." : "Signing in..."}
              </>
            ) : (
              isSignUp ? "Register Business & Get Started" : "Sign In to Terminal"
            )}
          </button>
        </form>

        {/* Toggle Form Mode Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setSuccess("");
            }}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "New to FreshMart? Register your business"}
          </button>
        </div>

        {/* Demo Fast Login Area (Only shown in Sign In mode) */}
        {!isSignUp && (
          <>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Demo Access Accounts
              </span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin")}
                disabled={loading}
                className="rounded-lg border border-white/5 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Manager (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("cashier")}
                disabled={loading}
                className="rounded-lg border border-white/5 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Cashier John
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

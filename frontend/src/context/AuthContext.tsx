"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { safeStorage } from "@/lib/storage";
import { api } from "@/lib/api";

export interface User {
  name: string;
  username: string;
  role: "admin" | "cashier";
  businessName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (businessName: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  isServerHealthy: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isServerHealthy, setIsServerHealthy] = useState(true);

  useEffect(() => {
    const verifyHealth = async () => {
      // 1. Try currently configured URL
      try {
        const res = await api.checkHealth();
        if (res && res.status === "UP") {
          setIsServerHealthy(true);
          return;
        }
      } catch (e) {
        console.warn("Primary health check failed. Querying active tunnel registry...");
      }

      // 2. Fetch latest active tunnel URL from public ntfy cache
      try {
        const ntfyRes = await fetch('https://ntfy.sh/supermarket_akash_tunnel_topic/raw?poll=1');
        if (ntfyRes.ok) {
          const text = await ntfyRes.text();
          const lines = text.trim().split('\n');
          const activeUrl = lines[lines.length - 1].trim();
          
          if (activeUrl && activeUrl.startsWith('https://')) {
            const healthRes = await fetch(`${activeUrl}/health`);
            if (healthRes.ok) {
              const data = await healthRes.json();
              if (data && data.status === "UP") {
                api.setBaseUrl(activeUrl);
                setIsServerHealthy(true);
                console.log("Self-healing successful! Connected to active tunnel:", activeUrl);
                return;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Fallback active tunnel discovery failed:", err);
      }

      setIsServerHealthy(false);
    };

    verifyHealth();

    // 2. Poll server health check every 8 seconds
    const interval = setInterval(verifyHealth, 8000);

    // 3. Load session from localStorage on mount (secured with try-catch-finally)
    try {
      const savedUser = safeStorage.getItem("auth_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn("Auth initialization storage blocked:", e);
    } finally {
      setLoading(false);
    }

    return () => clearInterval(interval);
  }, []);

  const login = async (username: string, password: string) => {
    // Simulate brief API roundtrip delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    let networkError: string | null = null;

    // 1. Try online login first using backend REST endpoint (allows phone-to-laptop sharing!)
    try {
      const response = await api.login(cleanUsername, cleanPassword);
      if (response && response.username) {
        const newUser: User = {
          name: response.role === "admin" ? (response.businessName + " Manager") : response.businessName,
          username: response.username,
          role: (response.role as "admin" | "cashier") || "admin",
          businessName: response.businessName
        };
        setUser(newUser);
        safeStorage.setItem("auth_user", JSON.stringify(newUser));
        return;
      }
    } catch (err: any) {
      console.warn("Backend authentication failed/unreachable.", err);
      // If it's a 401 Unauthorized, throw immediately so user knows password/username is incorrect
      if (err.message && (err.message.includes("401") || err.message.toLowerCase().includes("invalid"))) {
        throw new Error("Invalid username or password");
      }
      networkError = err.message || "Failed to reach backend server";
    }

    // 2. Check custom registered users list in localStorage fallback
    try {
      const savedRegisteredList = safeStorage.getItem("registered_users");
      if (savedRegisteredList) {
        const list = JSON.parse(savedRegisteredList) as any[];
        const match = list.find((u) => u.username.toLowerCase() === cleanUsername);
        if (match) {
          if (match.password === cleanPassword) {
            const newUser: User = {
              name: match.businessName + " Manager",
              username: match.username,
              role: match.role || "admin",
              businessName: match.businessName
            };
            setUser(newUser);
            safeStorage.setItem("auth_user", JSON.stringify(newUser));
            return;
          } else {
            throw new Error("Invalid username or password");
          }
        }
      }
    } catch (e: any) {
      if (e.message === "Invalid username or password") throw e;
      console.error("Failed to parse custom registered users list", e);
    }

    // 3. Default Demo Accounts fallback
    if (cleanPassword === "password123") {
      let newUser: User;

      if (cleanUsername === "admin") {
        newUser = {
          name: "Admin Manager",
          username: "admin",
          role: "admin",
          businessName: "Demo Business"
        };
        setUser(newUser);
        safeStorage.setItem("auth_user", JSON.stringify(newUser));
        return;
      } else if (cleanUsername === "cashier") {
        newUser = {
          name: "John Cashier",
          username: "cashier",
          role: "cashier",
          businessName: "Demo Business"
        };
        setUser(newUser);
        safeStorage.setItem("auth_user", JSON.stringify(newUser));
        return;
      }
    }

    if (networkError) {
      throw new Error("Unable to connect. Please try again in a moment.");
    }

    throw new Error("Invalid username or password");
  };

  const register = async (businessName: string, username: string, password: string) => {
    // Simulate brief API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername === "admin" || cleanUsername === "cashier") {
      throw new Error("Username already taken.");
    }

    // 1. Try online registration first (saves to AWS DynamoDB!)
    try {
      await api.register(businessName, cleanUsername, password);
      return; // Online registration success
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes("taken")) {
        throw new Error("Username already taken.");
      }
      console.warn("Backend registration failed/unreachable. Falling back to local storage signup.", err);
    }

    // 2. Local fallback registration
    let list = [];
    try {
      const savedRegisteredList = safeStorage.getItem("registered_users");
      if (savedRegisteredList) {
        list = JSON.parse(savedRegisteredList);
      }
    } catch (e) {
      list = [];
    }

    if (list.some((u: any) => u.username.toLowerCase() === cleanUsername)) {
      throw new Error("Username already taken.");
    }

    const newUserRecord = {
      businessName: businessName.trim(),
      username: cleanUsername,
      password: password.trim(),
      role: "admin",
    };

    list.push(newUserRecord);
    safeStorage.setItem("registered_users", JSON.stringify(list));
  };

  const logout = () => {
    setUser(null);
    safeStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
        isServerHealthy,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";

interface SyncContextType {
  triggerSync: (entity: string) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const listenersRef = useRef<Map<string, Set<() => void>>>(new Map());

  useEffect(() => {
    // Initialize BroadcastChannel on client side
    const channel = new BroadcastChannel("freshmart_sync");
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { entity } = event.data;
      if (entity) {
        const listeners = listenersRef.current.get(entity);
        if (listeners) {
          listeners.forEach((cb) => {
            try {
              cb();
            } catch (err) {
              console.error(`Error invoking sync callback for ${entity}:`, err);
            }
          });
        }
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const triggerSync = (entity: string) => {
    // 1. Notify other tabs/windows
    if (channelRef.current) {
      channelRef.current.postMessage({ entity });
    }
    // 2. Notify current page listeners
    const listeners = listenersRef.current.get(entity);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb();
        } catch (err) {
          console.error(`Error invoking sync callback for ${entity}:`, err);
        }
      });
    }
  };

  const registerListener = (entity: string, cb: () => void) => {
    if (!listenersRef.current.has(entity)) {
      listenersRef.current.set(entity, new Set());
    }
    listenersRef.current.get(entity)!.add(cb);

    return () => {
      const listeners = listenersRef.current.get(entity);
      if (listeners) {
        listeners.delete(cb);
      }
    };
  };

  return (
    <SyncContext.Provider value={{ triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(entity: string, callback: () => void) {
  const context = useContext(SyncContext);
  
  // Keep the latest callback in a ref to avoid resetting effects on re-renders
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Direct registration with the provider if available
    // Otherwise fallback to local event listener if used outside provider
    const syncChannel = new BroadcastChannel("freshmart_sync");
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.entity === entity) {
        callbackRef.current();
      }
    };

    syncChannel.addEventListener("message", handleMessage);

    return () => {
      syncChannel.removeEventListener("message", handleMessage);
      syncChannel.close();
    };
  }, [entity]);

  return context ? context.triggerSync : () => {
    // Fallback trigger if context is missing
    const syncChannel = new BroadcastChannel("freshmart_sync");
    syncChannel.postMessage({ entity });
    syncChannel.close();
  };
}

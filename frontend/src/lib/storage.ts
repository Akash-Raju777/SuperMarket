"use client";

class SafeStorage {
  private memoryStore: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn("Storage read blocked, using memory fallback", e);
    }
    return this.memoryStore[key] || null;
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn("Storage write blocked, using memory fallback", e);
    }
    this.memoryStore[key] = value;
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn("Storage delete blocked, using memory fallback", e);
    }
    delete this.memoryStore[key];
  }
}

export const safeStorage = new SafeStorage();

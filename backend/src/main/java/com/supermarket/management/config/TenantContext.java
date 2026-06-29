package com.supermarket.management.config;

public class TenantContext {
    private static final ThreadLocal<String> currentTenant = new ThreadLocal<>();

    public static void setCurrentTenant(String tenant) {
        currentTenant.set(tenant);
    }

    public static String getCurrentTenant() {
        String tenant = currentTenant.get();
        return tenant != null ? tenant : "default";
    }

    public static void clear() {
        currentTenant.remove();
    }
}

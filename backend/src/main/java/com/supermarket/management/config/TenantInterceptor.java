package com.supermarket.management.config;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class TenantInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // If TenantContext has already been set (e.g., by JwtAuthenticationFilter), preserve it!
        if (TenantContext.getCurrentTenant() != null && !TenantContext.getCurrentTenant().equals("default")) {
            System.out.println("TenantInterceptor: Tenant already set to " + TenantContext.getCurrentTenant() + ", keeping context.");
            return true;
        }

        String businessOwner = request.getHeader("X-Business-Owner");
        System.out.println("TenantInterceptor: URI=" + request.getRequestURI() + ", Method=" + request.getMethod() + ", X-Business-Owner=" + businessOwner);
        if (businessOwner != null && !businessOwner.trim().isEmpty()) {
            String owner = businessOwner.trim();
            if (owner.equalsIgnoreCase("Demo Business")) {
                owner = "Demo Business";
            }
            TenantContext.setCurrentTenant(owner);
        } else {
            TenantContext.setCurrentTenant("default");
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        TenantContext.clear();
    }
}

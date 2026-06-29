package com.supermarket.management.service;

import com.supermarket.management.config.TenantContext;
import com.supermarket.management.model.Product;
import com.supermarket.management.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final NotificationService notificationService;

    public ProductService(ProductRepository productRepository, NotificationService notificationService) {
        this.productRepository = productRepository;
        this.notificationService = notificationService;
    }

    public List<Product> getAllProducts() {
        // Run expiry checks asynchronously to prevent blocking the product retrieval
        final String tenant = TenantContext.getCurrentTenant();
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                TenantContext.setCurrentTenant(tenant);
                notificationService.runExpiryAndSalesChecks();
            } finally {
                TenantContext.clear();
            }
        });
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(String id) {
        return productRepository.findById(id);
    }

    public Product saveProduct(Product product) {
        Product saved = productRepository.save(product);
        notificationService.triggerStockCheck(saved);
        
        final String tenant = TenantContext.getCurrentTenant();
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                TenantContext.setCurrentTenant(tenant);
                notificationService.runExpiryAndSalesChecks();
            } finally {
                TenantContext.clear();
            }
        });
        return saved;
    }

    public void deleteProduct(String id) {
        productRepository.deleteById(id);
    }

    public Map<String, Object> getProductStats() {
        List<Product> products = productRepository.findAll();
        LocalDate today = LocalDate.now();
        LocalDate limitNearExpiry = today.plusDays(30);

        long totalCount = products.size();
        long expiredCount = 0;
        long expiringSoonCount = 0; // within 30 days

        for (Product p : products) {
            if (p.getExpDate() != null && !p.getExpDate().trim().isEmpty()) {
                try {
                    LocalDate exp = LocalDate.parse(p.getExpDate());
                    if (exp.isBefore(today)) {
                        expiredCount++;
                    } else if (!exp.isAfter(limitNearExpiry)) {
                        expiringSoonCount++;
                    }
                } catch (Exception e) {
                    // Ignore date format issues for stats
                }
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProducts", totalCount);
        stats.put("expiredProducts", expiredCount);
        stats.put("expiringSoonProducts", expiringSoonCount);
        return stats;
    }
}

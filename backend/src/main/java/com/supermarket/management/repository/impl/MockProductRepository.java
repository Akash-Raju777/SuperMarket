package com.supermarket.management.repository.impl;

import com.supermarket.management.model.Product;
import com.supermarket.management.repository.ProductRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@Profile("!aws")
public class MockProductRepository implements ProductRepository {

    private final Map<String, Product> products = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        LocalDate today = LocalDate.now(); // 2026-06-24

        // Safe Products (🟢)
        saveProduct(new Product("P101", "Organic Whole Milk", "Lactaid", "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=300", 
                today.minusDays(5).toString(), today.plusDays(15).toString(), today.minusDays(4).toString(), 25, 4.49));
        
        saveProduct(new Product("P102", "Whole Wheat Bread", "Nature's Own", "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300", 
                today.minusDays(2).toString(), today.plusDays(6).toString(), today.minusDays(1).toString(), 4, 3.29)); // Low Stock!

        saveProduct(new Product("P103", "Extra Virgin Olive Oil", "Filippo Berio", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=300", 
                today.minusMonths(6).toString(), today.plusYears(1).toString(), today.minusMonths(5).toString(), 15, 12.99));

        // Near Expiry Products (🟡 - within 3 days or approaches)
        // Let's create one expiring tomorrow: today.plusDays(1)
        saveProduct(new Product("P104", "Greek Yogurt (Strawberry)", "Chobani", "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=300", 
                today.minusDays(10).toString(), today.plusDays(1).toString(), today.minusDays(9).toString(), 30, 1.89));

        // Let's create one expiring in 2 days
        saveProduct(new Product("P105", "Fresh Raspberries", "Driscoll's", "https://images.unsplash.com/photo-1577069861033-55d04cec4ef5?auto=format&fit=crop&q=80&w=300", 
                today.minusDays(4).toString(), today.plusDays(2).toString(), today.minusDays(3).toString(), 45, 4.99));

        // Expired Products (🔴)
        saveProduct(new Product("P106", "Sour Cream (Light)", "Daisy", "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=300", 
                today.minusDays(20).toString(), today.minusDays(2).toString(), today.minusDays(18).toString(), 8, 2.49));

        saveProduct(new Product("P107", "Organic Spinach (Pre-Washed)", "Earthbound", "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=300", 
                today.minusDays(10).toString(), today.minusDays(1).toString(), today.minusDays(9).toString(), 12, 3.99));

        // Slow Moving + Near Expiry (🟡)
        // Expiring in 3 days, but has high quantity and price
        saveProduct(new Product("P108", "Premium Ribeye Steak", "Angus Beef", "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=300", 
                today.minusDays(7).toString(), today.plusDays(3).toString(), today.minusDays(6).toString(), 18, 19.99));

        // Regular Goods
        saveProduct(new Product("P109", "Jasmine Rice 5lb", "Mahatma", "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300", 
                today.minusMonths(2).toString(), today.plusMonths(10).toString(), today.minusMonths(1).toString(), 50, 6.99));

        saveProduct(new Product("P110", "Detergent Pods (3in1)", "Tide", "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300", 
                today.minusMonths(4).toString(), today.plusYears(2).toString(), today.minusMonths(3).toString(), 40, 14.99));
        
        saveProduct(new Product("P111", "Spaghetti Pasta", "Barilla", "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&q=80&w=300", 
                today.minusMonths(3).toString(), today.plusYears(1).toString(), today.minusMonths(2).toString(), 0, 1.49)); // Out of stock!
    }

    private void saveProduct(Product p) {
        products.put(p.getId(), p);
    }

    @Override
    public List<Product> findAll() {
        return new ArrayList<>(products.values());
    }

    @Override
    public Optional<Product> findById(String id) {
        return Optional.ofNullable(products.get(id));
    }

    @Override
    public Product save(Product product) {
        if (product.getId() == null || product.getId().trim().isEmpty()) {
            // Generate simple custom ID
            String nextId = "P" + (100 + products.size() + 1);
            product.setId(nextId);
        }
        products.put(product.getId(), product);
        return product;
    }

    @Override
    public void deleteById(String id) {
        products.remove(id);
    }
}

package com.supermarket.management.repository.impl;

import com.supermarket.management.model.Notification;
import com.supermarket.management.repository.NotificationRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@Profile("!aws")
public class MockNotificationRepository implements NotificationRepository {

    private final Map<String, Notification> notifications = new ConcurrentHashMap<>();
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @PostConstruct
    public void init() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Low Stock alert
        saveNotification(new Notification("NOT701", "LOW_STOCK", 
                "Product stock is critically low. Only 4 units of 'Whole Wheat Bread' left.", 
                "P102", now.minusHours(4).format(formatter), false));

        // 2. Out of Stock alert
        saveNotification(new Notification("NOT702", "OUT_OF_STOCK", 
                "Product 'Spaghetti Pasta' is out of stock.", 
                "P111", now.minusHours(12).format(formatter), false));

        // 3. Expired alert
        saveNotification(new Notification("NOT703", "EXPIRED", 
                "Product 'Sour Cream (Light)' has expired on " + now.toLocalDate().minusDays(2).toString() + " but still exists in inventory.", 
                "P106", now.minusDays(1).format(formatter), false));

        // 4. Expiring Soon alert
        saveNotification(new Notification("NOT704", "EXPIRING_SOON", 
                "Product 'Greek Yogurt (Strawberry)' will expire within 3 days (on " + now.toLocalDate().plusDays(1).toString() + ").", 
                "P104", now.minusHours(2).format(formatter), false));

        // 5. Slow Sales + Near Expiry alert
        saveNotification(new Notification("NOT705", "SLOW_SALES_NEAR_EXPIRY", 
                "Product 'Premium Ribeye Steak' is selling slowly and will expire in 3 days. Recommend creating a promotional offer.", 
                "P108", now.minusHours(1).format(formatter), false));
    }

    private void saveNotification(Notification n) {
        notifications.put(n.getNotificationId(), n);
    }

    @Override
    public List<Notification> findAll() {
        return new ArrayList<>(notifications.values());
    }

    @Override
    public Optional<Notification> findById(String id) {
        return Optional.ofNullable(notifications.get(id));
    }

    @Override
    public Notification save(Notification notification) {
        if (notification.getNotificationId() == null || notification.getNotificationId().trim().isEmpty()) {
            String nextId = "NOT" + (700 + notifications.size() + 1);
            notification.setNotificationId(nextId);
        }
        notifications.put(notification.getNotificationId(), notification);
        return notification;
    }

    @Override
    public long countUnread() {
        return notifications.values().stream()
                .filter(n -> !n.getReadStatus())
                .count();
    }
}

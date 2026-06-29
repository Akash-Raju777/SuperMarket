package com.supermarket.management.service;

import com.supermarket.management.model.Notification;
import com.supermarket.management.model.Product;
import com.supermarket.management.model.Sale;
import com.supermarket.management.repository.NotificationRepository;
import com.supermarket.management.repository.ProductRepository;
import com.supermarket.management.repository.SaleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public NotificationService(NotificationRepository notificationRepository,
                               ProductRepository productRepository,
                               SaleRepository saleRepository) {
        this.notificationRepository = notificationRepository;
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public void markAsRead(String id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setReadStatus(true);
            notificationRepository.save(n);
        });
    }

    public long getUnreadCount() {
        return notificationRepository.countUnread();
    }

    public void triggerStockCheck(Product product) {
        LocalDateTime now = LocalDateTime.now();
        List<Notification> existing = notificationRepository.findAll();

        if (product.getQuantity() == 0) {
            boolean exists = existing.stream()
                    .anyMatch(n -> "OUT_OF_STOCK".equals(n.getType()) && product.getId().equals(n.getProductId()) && !n.getReadStatus());
            if (!exists) {
                Notification n = Notification.builder()
                        .type("OUT_OF_STOCK")
                        .message("Product '" + product.getName() + "' (ID: " + product.getId() + ") is completely out of stock.")
                        .productId(product.getId())
                        .timestamp(now.format(formatter))
                        .readStatus(false)
                        .build();
                notificationRepository.save(n);
            }
        } else if (product.getQuantity() <= 5) {
            boolean exists = existing.stream()
                    .anyMatch(n -> "LOW_STOCK".equals(n.getType()) && product.getId().equals(n.getProductId()) && !n.getReadStatus());
            if (!exists) {
                Notification n = Notification.builder()
                        .type("LOW_STOCK")
                        .message("Product stock is critically low. Only " + product.getQuantity() + " units of '" + product.getName() + "' left.")
                        .productId(product.getId())
                        .timestamp(now.format(formatter))
                        .readStatus(false)
                        .build();
                notificationRepository.save(n);
            }
        }
    }

    public void runExpiryAndSalesChecks() {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        List<Product> products = productRepository.findAll();
        List<Sale> sales = saleRepository.findAll();
        List<Notification> existing = notificationRepository.findAll();

        for (Product product : products) {
            if (product.getExpDate() == null || product.getExpDate().trim().isEmpty()) {
                continue;
            }

            try {
                LocalDate expDate = LocalDate.parse(product.getExpDate());
                
                // 1. Expired Alert
                if (expDate.isBefore(today)) {
                    boolean exists = existing.stream()
                            .anyMatch(n -> "EXPIRED".equals(n.getType()) && product.getId().equals(n.getProductId()) && !n.getReadStatus());
                    if (!exists) {
                        Notification n = Notification.builder()
                                .type("EXPIRED")
                                .message("Product '" + product.getName() + "' (ID: " + product.getId() + ") has expired on " + product.getExpDate() + " but still exists in inventory.")
                                .productId(product.getId())
                                .timestamp(now.format(formatter))
                                .readStatus(false)
                                .build();
                        notificationRepository.save(n);
                    }
                }
                // 2. Expiring Soon Alert (within next 3 days)
                else {
                    long daysUntilExpiry = ChronoUnit.DAYS.between(today, expDate);
                    if (daysUntilExpiry >= 0 && daysUntilExpiry <= 3) {
                        boolean exists = existing.stream()
                                .anyMatch(n -> "EXPIRING_SOON".equals(n.getType()) && product.getId().equals(n.getProductId()) && !n.getReadStatus());
                        if (!exists) {
                            Notification n = Notification.builder()
                                    .type("EXPIRING_SOON")
                                    .message("Product '" + product.getName() + "' (ID: " + product.getId() + ") will expire in " + daysUntilExpiry + " days (on " + product.getExpDate() + ").")
                                    .productId(product.getId())
                                    .timestamp(now.format(formatter))
                                    .readStatus(false)
                                    .build();
                            notificationRepository.save(n);
                        }

                        // 3. Slow Sales + Near Expiry Alert
                        // Calculate total sales in past 7 days
                        LocalDate sevenDaysAgo = today.minusDays(7);
                        long recentSalesCount = sales.stream()
                                .filter(s -> s.getProductId().equals(product.getId()))
                                .filter(s -> {
                                    try {
                                        LocalDate sDate = LocalDate.parse(s.getSaleDate());
                                        return !sDate.isBefore(sevenDaysAgo);
                                    } catch (Exception e) {
                                        return false;
                                    }
                                })
                                .mapToInt(Sale::getQuantitySold)
                                .sum();

                        if (recentSalesCount < 5 && product.getQuantity() > 0) {
                            boolean existsSlow = existing.stream()
                                    .anyMatch(n -> "SLOW_SALES_NEAR_EXPIRY".equals(n.getType()) && product.getId().equals(n.getProductId()) && !n.getReadStatus());
                            if (!existsSlow) {
                                Notification n = Notification.builder()
                                        .type("SLOW_SALES_NEAR_EXPIRY")
                                        .message("Product '" + product.getName() + "' is approaching expiry (" + daysUntilExpiry + " days left) and is selling slowly (sold " + recentSalesCount + " units in 7 days). Recommend promotional discounting.")
                                        .productId(product.getId())
                                        .timestamp(now.format(formatter))
                                        .readStatus(false)
                                        .build();
                                notificationRepository.save(n);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // Ignore parsing errors for mock formatting
            }
        }
    }
}

package com.supermarket.management.service;

import com.supermarket.management.model.Product;
import com.supermarket.management.model.Sale;
import com.supermarket.management.repository.ProductRepository;
import com.supermarket.management.repository.SaleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;

    public AnalyticsService(ProductRepository productRepository, SaleRepository saleRepository) {
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
    }

    public Map<String, Object> getDashboardAnalytics() {
        List<Product> products = productRepository.findAll();
        List<Sale> sales = saleRepository.findAll();

        Map<String, Object> analytics = new HashMap<>();

        // 1. KPI Metrics
        double totalRevenue = sales.stream().mapToDouble(Sale::getTotalAmount).sum();
        long totalOrders = sales.stream().map(Sale::getBillId).distinct().count();
        double avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0.0;
        long lowStockCount = products.stream().filter(p -> p.getQuantity() > 0 && p.getQuantity() <= 5).count();
        long outOfStockCount = products.stream().filter(p -> p.getQuantity() == 0).count();

        analytics.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        analytics.put("totalOrders", totalOrders);
        analytics.put("averageOrderValue", Math.round(avgOrderValue * 100.0) / 100.0);
        analytics.put("lowStockCount", lowStockCount);
        analytics.put("outOfStockCount", outOfStockCount);

        // 2. Product-wise sales performance (Top Sellers)
        Map<String, Integer> productQtySold = sales.stream()
                .collect(Collectors.groupingBy(Sale::getProductId, Collectors.summingInt(Sale::getQuantitySold)));

        List<Map<String, Object>> topSellers = productQtySold.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    Optional<Product> p = productRepository.findById(entry.getKey());
                    item.put("productId", entry.getKey());
                    item.put("productName", p.map(Product::getName).orElse("Unknown Product"));
                    item.put("quantitySold", entry.getValue());
                    item.put("revenue", Math.round(sales.stream()
                            .filter(s -> s.getProductId().equals(entry.getKey()))
                            .mapToDouble(Sale::getTotalAmount).sum() * 100.0) / 100.0);
                    return item;
                })
                .sorted((a, b) -> Integer.compare((Integer) b.get("quantitySold"), (Integer) a.get("quantitySold")))
                .limit(5)
                .collect(Collectors.toList());

        analytics.put("topSellers", topSellers);

        // 3. Slow-Moving Products (least sales in inventory)
        List<Map<String, Object>> slowMovers = products.stream()
                .map(p -> {
                    Map<String, Object> item = new HashMap<>();
                    int sold = productQtySold.getOrDefault(p.getId(), 0);
                    item.put("productId", p.getId());
                    item.put("productName", p.getName());
                    item.put("brand", p.getBrand());
                    item.put("quantityInStock", p.getQuantity());
                    item.put("quantitySold", sold);
                    return item;
                })
                .sorted(Comparator.comparingInt(a -> (Integer) a.get("quantitySold")))
                .limit(5)
                .collect(Collectors.toList());

        analytics.put("slowMovers", slowMovers);

        // 4. Daily Sales Trend (past 7 days)
        Map<String, Double> dailyRevenue = sales.stream()
                .collect(Collectors.groupingBy(Sale::getSaleDate, Collectors.summingDouble(Sale::getTotalAmount)));

        List<Map<String, Object>> dailyTrend = dailyRevenue.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> trendItem = new HashMap<>();
                    trendItem.put("date", entry.getKey());
                    trendItem.put("revenue", Math.round(entry.getValue() * 100.0) / 100.0);
                    return trendItem;
                })
                .sorted(Comparator.comparing(a -> (String) a.get("date")))
                .collect(Collectors.toList());

        analytics.put("dailyTrend", dailyTrend);

        // 5. Weekly Sales Trend
        // Map sales to "Week X" of the year
        Map<String, Double> weeklyRevenue = new HashMap<>();
        for (Sale sale : sales) {
            try {
                LocalDate date = LocalDate.parse(sale.getSaleDate());
                int weekOfYear = date.get(WeekFields.of(Locale.getDefault()).weekOfWeekBasedYear());
                String weekLabel = "Week " + weekOfYear;
                weeklyRevenue.put(weekLabel, weeklyRevenue.getOrDefault(weekLabel, 0.0) + sale.getTotalAmount());
            } catch (Exception e) {
                weeklyRevenue.put("Other", weeklyRevenue.getOrDefault("Other", 0.0) + sale.getTotalAmount());
            }
        }
        List<Map<String, Object>> weeklyTrend = new ArrayList<>();
        for (Map.Entry<String, Double> entry : weeklyRevenue.entrySet()) {
            Map<String, Object> weekItem = new HashMap<>();
            weekItem.put("week", entry.getKey());
            weekItem.put("revenue", Math.round(entry.getValue() * 100.0) / 100.0);
            weeklyTrend.add(weekItem);
        }
        // Sort weekly trend roughly by key
        weeklyTrend.sort(Comparator.comparing(a -> (String) a.get("week")));
        analytics.put("weeklyTrend", weeklyTrend);

        // 6. Monthly Sales Trend
        Map<String, Double> monthlyRevenue = new HashMap<>();
        for (Sale sale : sales) {
            try {
                String yearMonth = sale.getSaleDate().substring(0, 7); // "YYYY-MM"
                monthlyRevenue.put(yearMonth, monthlyRevenue.getOrDefault(yearMonth, 0.0) + sale.getTotalAmount());
            } catch (Exception e) {
                monthlyRevenue.put("Other", monthlyRevenue.getOrDefault("Other", 0.0) + sale.getTotalAmount());
            }
        }
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        for (Map.Entry<String, Double> entry : monthlyRevenue.entrySet()) {
            Map<String, Object> monthItem = new HashMap<>();
            monthItem.put("month", entry.getKey());
            monthItem.put("revenue", Math.round(entry.getValue() * 100.0) / 100.0);
            monthlyTrend.add(monthItem);
        }
        monthlyTrend.sort(Comparator.comparing(a -> (String) a.get("month")));
        analytics.put("monthlyTrend", monthlyTrend);

        // 7. Inventory movement (Category / Status breakdown)
        long totalProducts = products.size();
        long expired = products.stream().filter(p -> {
            try {
                return LocalDate.parse(p.getExpDate()).isBefore(LocalDate.now());
            } catch (Exception e) {
                return false;
            }
        }).count();

        long nearExpiry = products.stream().filter(p -> {
            try {
                LocalDate exp = LocalDate.parse(p.getExpDate());
                LocalDate today = LocalDate.now();
                return !exp.isBefore(today) && !exp.isAfter(today.plusDays(30));
            } catch (Exception e) {
                return false;
            }
        }).count();

        long safe = totalProducts - expired - nearExpiry;

        Map<String, Long> inventoryBreakdown = new HashMap<>();
        inventoryBreakdown.put("safe", safe);
        inventoryBreakdown.put("nearExpiry", nearExpiry);
        inventoryBreakdown.put("expired", expired);
        analytics.put("inventoryBreakdown", inventoryBreakdown);

        return analytics;
    }
}

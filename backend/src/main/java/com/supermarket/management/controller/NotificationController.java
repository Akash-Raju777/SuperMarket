package com.supermarket.management.controller;

import com.supermarket.management.model.Notification;
import com.supermarket.management.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<Notification> getNotifications() {
        // Dynamically recalculate triggers before listing alerts
        notificationService.runExpiryAndSalesChecks();
        return notificationService.getAllNotifications();
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount() {
        long count = notificationService.getUnreadCount();
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return response;
    }
}

package com.supermarket.management.repository;

import com.supermarket.management.model.Notification;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository {
    List<Notification> findAll();
    Optional<Notification> findById(String id);
    Notification save(Notification notification);
    long countUnread();
}

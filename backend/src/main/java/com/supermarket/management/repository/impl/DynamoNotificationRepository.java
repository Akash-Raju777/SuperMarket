package com.supermarket.management.repository.impl;

import com.supermarket.management.model.Notification;
import com.supermarket.management.repository.NotificationRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@Profile("aws")
public class DynamoNotificationRepository implements NotificationRepository {

    private final DynamoDbTable<Notification> notificationTable;

    public DynamoNotificationRepository(DynamoDbEnhancedClient enhancedClient) {
        this.notificationTable = enhancedClient.table("Notifications", TableSchema.fromBean(Notification.class));
    }

    @Override
    public List<Notification> findAll() {
        return notificationTable.scan().items().stream().collect(Collectors.toList());
    }

    @Override
    public Optional<Notification> findById(String id) {
        return Optional.ofNullable(notificationTable.getItem(Key.builder().partitionValue(id).build()));
    }

    @Override
    public Notification save(Notification notification) {
        if (notification.getNotificationId() == null || notification.getNotificationId().trim().isEmpty()) {
            notification.setNotificationId("NOT" + System.currentTimeMillis());
        }
        notificationTable.putItem(notification);
        return notification;
    }

    @Override
    public long countUnread() {
        return notificationTable.scan().items().stream()
                .filter(n -> n.getReadStatus() != null && !n.getReadStatus())
                .count();
    }
}

package com.supermarket.management.repository.impl;

import com.supermarket.management.config.TenantContext;
import com.supermarket.management.model.Notification;
import com.supermarket.management.repository.NotificationRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
@Profile("rds")
public class PostgresNotificationRepository implements NotificationRepository {

    private final JdbcTemplate jdbcTemplate;

    public PostgresNotificationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Notification> rowMapper = new RowMapper<Notification>() {
        @Override
        public Notification mapRow(ResultSet rs, int rowNum) throws SQLException {
            Notification n = new Notification();
            n.setNotificationId(rs.getString("notificationId"));
            n.setType(rs.getString("type"));
            n.setMessage(rs.getString("message"));
            n.setProductId(rs.getString("productId"));
            n.setTimestamp(rs.getString("timestamp"));
            n.setReadStatus(rs.getBoolean("readStatus"));
            return n;
        }
    };

    @Override
    public List<Notification> findAll() {
        String tenant = TenantContext.getCurrentTenant();
        return jdbcTemplate.query("SELECT notificationId, type, message, productId, timestamp, readStatus FROM notifications WHERE business_id = ?", rowMapper, tenant);
    }

    @Override
    public Optional<Notification> findById(String id) {
        String tenant = TenantContext.getCurrentTenant();
        List<Notification> list = jdbcTemplate.query(
                "SELECT notificationId, type, message, productId, timestamp, readStatus FROM notifications WHERE notificationId = ? AND business_id = ?",
                rowMapper,
                id,
                tenant
        );
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public Notification save(Notification notification) {
        if (notification.getNotificationId() == null || notification.getNotificationId().trim().isEmpty()) {
            notification.setNotificationId("N" + System.currentTimeMillis());
        }

        String tenant = TenantContext.getCurrentTenant();
        Optional<Notification> existing = findById(notification.getNotificationId());
        if (existing.isPresent()) {
            jdbcTemplate.update(
                    "UPDATE notifications SET type = ?, message = ?, productId = ?, timestamp = ?, readStatus = ? WHERE notificationId = ? AND business_id = ?",
                    notification.getType(),
                    notification.getMessage(),
                    notification.getProductId(),
                    notification.getTimestamp(),
                    notification.getReadStatus(),
                    notification.getNotificationId(),
                    tenant
            );
        } else {
            jdbcTemplate.update(
                    "INSERT INTO notifications (notificationId, type, message, productId, timestamp, readStatus, business_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    notification.getNotificationId(),
                    notification.getType(),
                    notification.getMessage(),
                    notification.getProductId(),
                    notification.getTimestamp(),
                    notification.getReadStatus(),
                    tenant
            );
        }
        return notification;
    }

    @Override
    public long countUnread() {
        String tenant = TenantContext.getCurrentTenant();
        Long val = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE readStatus = false AND business_id = ?",
                Long.class,
                tenant
        );
        return val != null ? val : 0L;
    }
}

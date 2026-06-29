package com.supermarket.management.repository.impl;

import com.supermarket.management.config.TenantContext;
import com.supermarket.management.model.CustomerProfile;
import com.supermarket.management.repository.CustomerProfileRepository;
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
public class PostgresCustomerProfileRepository implements CustomerProfileRepository {

    private final JdbcTemplate jdbcTemplate;

    public PostgresCustomerProfileRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<CustomerProfile> rowMapper = new RowMapper<CustomerProfile>() {
        @Override
        public CustomerProfile mapRow(ResultSet rs, int rowNum) throws SQLException {
            CustomerProfile cp = new CustomerProfile();
            cp.setMobile(rs.getString("mobile"));
            cp.setName(rs.getString("name"));
            cp.setPoints(rs.getInt("points"));
            return cp;
        }
    };

    @Override
    public Optional<CustomerProfile> findByMobile(String mobile) {
        String tenant = TenantContext.getCurrentTenant();
        List<CustomerProfile> list = jdbcTemplate.query(
                "SELECT mobile, name, points FROM customer_profiles WHERE mobile = ? AND business_id = ?",
                rowMapper,
                mobile,
                tenant
        );
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public CustomerProfile save(CustomerProfile profile) {
        String tenant = TenantContext.getCurrentTenant();
        Optional<CustomerProfile> existing = findByMobile(profile.getMobile());
        if (existing.isPresent()) {
            jdbcTemplate.update(
                    "UPDATE customer_profiles SET name = ?, points = ? WHERE mobile = ? AND business_id = ?",
                    profile.getName(),
                    profile.getPoints(),
                    profile.getMobile(),
                    tenant
            );
        } else {
            jdbcTemplate.update(
                    "INSERT INTO customer_profiles (mobile, name, points, business_id) VALUES (?, ?, ?, ?)",
                    profile.getMobile(),
                    profile.getName(),
                    profile.getPoints(),
                    tenant
            );
        }
        return profile;
    }

    @Override
    public List<CustomerProfile> findAll() {
        String tenant = TenantContext.getCurrentTenant();
        return jdbcTemplate.query("SELECT mobile, name, points FROM customer_profiles WHERE business_id = ?", rowMapper, tenant);
    }
}

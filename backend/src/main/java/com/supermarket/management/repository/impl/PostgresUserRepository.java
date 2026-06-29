package com.supermarket.management.repository.impl;

import com.supermarket.management.model.UserAccount;
import com.supermarket.management.repository.UserRepository;
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
public class PostgresUserRepository implements UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public PostgresUserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<UserAccount> rowMapper = new RowMapper<UserAccount>() {
        @Override
        public UserAccount mapRow(ResultSet rs, int rowNum) throws SQLException {
            UserAccount ua = new UserAccount();
            ua.setUsername(rs.getString("username"));
            ua.setPassword(rs.getString("password"));
            ua.setBusinessName(rs.getString("business_name"));
            ua.setRole(rs.getString("role"));
            return ua;
        }
    };

    @Override
    public Optional<UserAccount> findByUsername(String username) {
        List<UserAccount> list = jdbcTemplate.query(
                "SELECT username, password, business_name, role FROM user_accounts WHERE username = ?",
                rowMapper,
                username
        );
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public UserAccount save(UserAccount userAccount) {
        Optional<UserAccount> existing = findByUsername(userAccount.getUsername());
        if (existing.isPresent()) {
            jdbcTemplate.update(
                    "UPDATE user_accounts SET password = ?, business_name = ?, role = ? WHERE username = ?",
                    userAccount.getPassword(),
                    userAccount.getBusinessName(),
                    userAccount.getRole(),
                    userAccount.getUsername()
            );
        } else {
            jdbcTemplate.update(
                    "INSERT INTO user_accounts (username, password, business_name, role) VALUES (?, ?, ?, ?)",
                    userAccount.getUsername(),
                    userAccount.getPassword(),
                    userAccount.getBusinessName(),
                    userAccount.getRole()
            );
        }
        return userAccount;
    }
}

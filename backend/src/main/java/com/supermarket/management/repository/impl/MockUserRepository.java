package com.supermarket.management.repository.impl;

import com.supermarket.management.model.UserAccount;
import com.supermarket.management.repository.UserRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@Profile("!aws")
public class MockUserRepository implements UserRepository {
    private final Map<String, UserAccount> users = new ConcurrentHashMap<>();

    public MockUserRepository() {
        users.put("admin", new UserAccount("admin", "password123", "Demo Business", "admin"));
        users.put("cashier", new UserAccount("cashier", "password123", "Demo Business", "cashier"));
    }

    @Override
    public Optional<UserAccount> findByUsername(String username) {
        return Optional.ofNullable(users.get(username.toLowerCase().trim()));
    }

    @Override
    public UserAccount save(UserAccount userAccount) {
        users.put(userAccount.getUsername().toLowerCase().trim(), userAccount);
        return userAccount;
    }
}

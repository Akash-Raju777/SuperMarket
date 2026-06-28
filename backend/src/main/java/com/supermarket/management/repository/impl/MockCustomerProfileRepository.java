package com.supermarket.management.repository.impl;

import com.supermarket.management.model.CustomerProfile;
import com.supermarket.management.repository.CustomerProfileRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@Profile("!aws")
public class MockCustomerProfileRepository implements CustomerProfileRepository {

    private final Map<String, CustomerProfile> profiles = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        profiles.put("9876543210", new CustomerProfile("9876543210", "John Doe", 60));
    }

    @Override
    public Optional<CustomerProfile> findByMobile(String mobile) {
        return Optional.ofNullable(profiles.get(mobile));
    }

    @Override
    public CustomerProfile save(CustomerProfile profile) {
        profiles.put(profile.getMobile(), profile);
        return profile;
    }

    @Override
    public java.util.List<CustomerProfile> findAll() {
        return new java.util.ArrayList<>(profiles.values());
    }
}

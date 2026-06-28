package com.supermarket.management.repository;

import com.supermarket.management.model.CustomerProfile;
import java.util.List;
import java.util.Optional;

public interface CustomerProfileRepository {
    Optional<CustomerProfile> findByMobile(String mobile);
    CustomerProfile save(CustomerProfile profile);
    List<CustomerProfile> findAll();
}

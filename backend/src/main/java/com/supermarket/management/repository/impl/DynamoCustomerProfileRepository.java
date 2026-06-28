package com.supermarket.management.repository.impl;

import com.supermarket.management.model.CustomerProfile;
import com.supermarket.management.repository.CustomerProfileRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.Optional;

@Repository
@Profile("aws")
public class DynamoCustomerProfileRepository implements CustomerProfileRepository {

    private final DynamoDbTable<CustomerProfile> customerTable;

    public DynamoCustomerProfileRepository(DynamoDbEnhancedClient enhancedClient) {
        this.customerTable = enhancedClient.table("Customers", TableSchema.fromBean(CustomerProfile.class));
    }

    @Override
    public Optional<CustomerProfile> findByMobile(String mobile) {
        return Optional.ofNullable(customerTable.getItem(Key.builder().partitionValue(mobile).build()));
    }

    @Override
    public CustomerProfile save(CustomerProfile profile) {
        customerTable.putItem(profile);
        return profile;
    }

    @Override
    public java.util.List<CustomerProfile> findAll() {
        return customerTable.scan().items().stream().collect(java.util.stream.Collectors.toList());
    }
}

package com.supermarket.management.repository.impl;

import com.supermarket.management.model.Product;
import com.supermarket.management.repository.ProductRepository;
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
public class DynamoProductRepository implements ProductRepository {

    private final DynamoDbTable<Product> productTable;

    public DynamoProductRepository(DynamoDbEnhancedClient enhancedClient) {
        this.productTable = enhancedClient.table("Products", TableSchema.fromBean(Product.class));
    }

    @Override
    public List<Product> findAll() {
        return productTable.scan().items().stream().collect(Collectors.toList());
    }

    @Override
    public Optional<Product> findById(String id) {
        return Optional.ofNullable(productTable.getItem(Key.builder().partitionValue(id).build()));
    }

    @Override
    public Product save(Product product) {
        if (product.getId() == null || product.getId().trim().isEmpty()) {
            product.setId("P" + System.currentTimeMillis());
        }
        productTable.putItem(product);
        return product;
    }

    @Override
    public void deleteById(String id) {
        productTable.deleteItem(Key.builder().partitionValue(id).build());
    }
}

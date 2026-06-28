package com.supermarket.management.repository.impl;

import com.supermarket.management.model.Sale;
import com.supermarket.management.repository.SaleRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.List;
import java.util.stream.Collectors;

@Repository
@Profile("aws")
public class DynamoSaleRepository implements SaleRepository {

    private final DynamoDbTable<Sale> saleTable;

    public DynamoSaleRepository(DynamoDbEnhancedClient enhancedClient) {
        this.saleTable = enhancedClient.table("Sales", TableSchema.fromBean(Sale.class));
    }

    @Override
    public List<Sale> findAll() {
        return saleTable.scan().items().stream().collect(Collectors.toList());
    }

    @Override
    public List<Sale> findByBillId(String billId) {
        QueryConditional queryConditional = QueryConditional
                .keyEqualTo(Key.builder().partitionValue(billId).build());
        return saleTable.query(queryConditional).items().stream().collect(Collectors.toList());
    }

    @Override
    public Sale save(Sale sale) {
        saleTable.putItem(sale);
        return sale;
    }
}

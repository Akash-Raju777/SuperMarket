package com.supermarket.management.repository.impl;

import com.supermarket.management.model.Offer;
import com.supermarket.management.repository.OfferRepository;
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
public class DynamoOfferRepository implements OfferRepository {

    private final DynamoDbTable<Offer> offerTable;

    public DynamoOfferRepository(DynamoDbEnhancedClient enhancedClient) {
        this.offerTable = enhancedClient.table("Offers", TableSchema.fromBean(Offer.class));
    }

    @Override
    public List<Offer> findAll() {
        return offerTable.scan().items().stream().collect(Collectors.toList());
    }

    @Override
    public Optional<Offer> findById(String id) {
        return Optional.ofNullable(offerTable.getItem(Key.builder().partitionValue(id).build()));
    }

    @Override
    public Offer save(Offer offer) {
        if (offer.getOfferId() == null || offer.getOfferId().trim().isEmpty()) {
            offer.setOfferId("OFF" + System.currentTimeMillis());
        }
        offerTable.putItem(offer);
        return offer;
    }

    @Override
    public void deleteById(String id) {
        offerTable.deleteItem(Key.builder().partitionValue(id).build());
    }
}

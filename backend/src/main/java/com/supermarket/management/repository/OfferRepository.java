package com.supermarket.management.repository;

import com.supermarket.management.model.Offer;
import java.util.List;
import java.util.Optional;

public interface OfferRepository {
    List<Offer> findAll();
    Optional<Offer> findById(String id);
    Offer save(Offer offer);
    void deleteById(String id);
}

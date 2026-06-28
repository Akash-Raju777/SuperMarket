package com.supermarket.management.repository.impl;

import com.supermarket.management.model.Offer;
import com.supermarket.management.repository.OfferRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@Profile("!aws")
public class MockOfferRepository implements OfferRepository {

    private final Map<String, Offer> offers = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        LocalDate today = LocalDate.now();

        // Active Offer 1: BOGO on Bread (P102)
        saveOffer(new Offer("OFF501", "P102", "BOGO", 50.0, true, 
                today.minusDays(2).toString(), today.plusDays(4).toString()));

        // Active Offer 2: 20% Discount on Yogurt (P104)
        saveOffer(new Offer("OFF502", "P104", "PERCENTAGE", 20.0, true, 
                today.minusDays(1).toString(), today.plusDays(5).toString()));

        // Active Offer 3: Flat $5.00 Off on Steak (P108)
        saveOffer(new Offer("OFF503", "P108", "FIXED", 5.00, true, 
                today.toString(), today.plusDays(3).toString()));

        // Inactive Offer 4: 10% Discount on Raspberries (P105)
        saveOffer(new Offer("OFF504", "P105", "PERCENTAGE", 10.0, false, 
                today.minusDays(5).toString(), today.plusDays(10).toString()));
    }

    private void saveOffer(Offer o) {
        offers.put(o.getOfferId(), o);
    }

    @Override
    public List<Offer> findAll() {
        return new ArrayList<>(offers.values());
    }

    @Override
    public Optional<Offer> findById(String id) {
        return Optional.ofNullable(offers.get(id));
    }

    @Override
    public Offer save(Offer offer) {
        if (offer.getOfferId() == null || offer.getOfferId().trim().isEmpty()) {
            String nextId = "OFF" + (500 + offers.size() + 1);
            offer.setOfferId(nextId);
        }
        offers.put(offer.getOfferId(), offer);
        return offer;
    }

    @Override
    public void deleteById(String id) {
        offers.remove(id);
    }
}

package com.supermarket.management.service;

import com.supermarket.management.model.Offer;
import com.supermarket.management.model.Sale;
import com.supermarket.management.repository.OfferRepository;
import com.supermarket.management.repository.SaleRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class OfferService {

    private final OfferRepository offerRepository;
    private final SaleRepository saleRepository;

    public OfferService(OfferRepository offerRepository, SaleRepository saleRepository) {
        this.offerRepository = offerRepository;
        this.saleRepository = saleRepository;
    }

    public List<Offer> getAllOffers() {
        return offerRepository.findAll();
    }

    public Optional<Offer> getOfferById(String id) {
        return offerRepository.findById(id);
    }

    public Offer saveOffer(Offer offer) {
        return offerRepository.save(offer);
    }

    public Optional<Offer> toggleOffer(String id) {
        Optional<Offer> offerOpt = offerRepository.findById(id);
        if (offerOpt.isPresent()) {
            Offer offer = offerOpt.get();
            offer.setActive(!offer.getActive());
            return Optional.of(offerRepository.save(offer));
        }
        return Optional.empty();
    }

    public List<Map<String, Object>> getOffersWithPerformance() {
        List<Offer> offers = offerRepository.findAll();
        List<Sale> sales = saleRepository.findAll();
        List<Map<String, Object>> performanceList = new ArrayList<>();

        for (Offer offer : offers) {
            long usageCount = 0;
            double totalRevenue = 0.0;

            for (Sale sale : sales) {
                if (sale.getProductId().equals(offer.getProductId())) {
                    // Check if the sale date is within the offer validity
                    try {
                        String sDate = sale.getSaleDate();
                        if (sDate.compareTo(offer.getStartDate()) >= 0 && sDate.compareTo(offer.getEndDate()) <= 0) {
                            usageCount++;
                            totalRevenue += sale.getTotalAmount();
                        }
                    } catch (Exception e) {
                        // Skip date parsing error
                    }
                }
            }

            Map<String, Object> perfMap = new HashMap<>();
            perfMap.put("offerId", offer.getOfferId());
            perfMap.put("productId", offer.getProductId());
            perfMap.put("offerType", offer.getOfferType());
            perfMap.put("discount", offer.getDiscount());
            perfMap.put("active", offer.getActive());
            perfMap.put("startDate", offer.getStartDate());
            perfMap.put("endDate", offer.getEndDate());
            perfMap.put("usageCount", usageCount);
            perfMap.put("revenue", Math.round(totalRevenue * 100.0) / 100.0);
            
            performanceList.add(perfMap);
        }

        return performanceList;
    }

    public void deleteOffer(String id) {
        offerRepository.deleteById(id);
    }
}

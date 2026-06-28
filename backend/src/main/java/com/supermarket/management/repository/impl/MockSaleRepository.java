package com.supermarket.management.repository.impl;

import com.supermarket.management.model.Sale;
import com.supermarket.management.repository.SaleRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
@Profile("!aws")
public class MockSaleRepository implements SaleRepository {

    private final Map<String, List<Sale>> sales = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        LocalDate today = LocalDate.now();

        // Sale 1: 5 days ago
        String b1 = "B2001";
        addSaleItem(b1, new Sale(b1, "P101", 2, today.minusDays(5).toString(), 8.98));
        addSaleItem(b1, new Sale(b1, "P103", 1, today.minusDays(5).toString(), 12.99));

        // Sale 2: 4 days ago
        String b2 = "B2002";
        addSaleItem(b2, new Sale(b2, "P104", 3, today.minusDays(4).toString(), 5.67));
        addSaleItem(b2, new Sale(b2, "P102", 2, today.minusDays(4).toString(), 6.58));

        // Sale 3: 3 days ago
        String b3 = "B2003";
        addSaleItem(b3, new Sale(b3, "P108", 1, today.minusDays(3).toString(), 19.99));
        addSaleItem(b3, new Sale(b3, "P105", 2, today.minusDays(3).toString(), 9.98));

        // Sale 4: 2 days ago
        String b4 = "B2004";
        addSaleItem(b4, new Sale(b4, "P101", 4, today.minusDays(2).toString(), 17.96));
        addSaleItem(b4, new Sale(b4, "P110", 1, today.minusDays(2).toString(), 14.99));

        // Sale 5: Yesterday
        String b5 = "B2005";
        addSaleItem(b5, new Sale(b5, "P103", 1, today.minusDays(1).toString(), 12.99));
        addSaleItem(b5, new Sale(b5, "P105", 4, today.minusDays(1).toString(), 19.96));
        addSaleItem(b5, new Sale(b5, "P104", 5, today.minusDays(1).toString(), 9.45));

        // Sale 6: Today
        String b6 = "B2006";
        addSaleItem(b6, new Sale(b6, "P102", 1, today.toString(), 3.29));
        addSaleItem(b6, new Sale(b6, "P109", 2, today.toString(), 13.98));
    }

    private void addSaleItem(String billId, Sale item) {
        sales.computeIfAbsent(billId, k -> new ArrayList<>()).add(item);
    }

    @Override
    public List<Sale> findAll() {
        return sales.values().stream()
                .flatMap(List::stream)
                .collect(Collectors.toList());
    }

    @Override
    public List<Sale> findByBillId(String billId) {
        return sales.getOrDefault(billId, new ArrayList<>());
    }

    @Override
    public Sale save(Sale sale) {
        addSaleItem(sale.getBillId(), sale);
        return sale;
    }
}

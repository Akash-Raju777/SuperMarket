package com.supermarket.management.repository;

import com.supermarket.management.model.Sale;
import java.util.List;

public interface SaleRepository {
    List<Sale> findAll();
    List<Sale> findByBillId(String billId);
    Sale save(Sale sale);
}

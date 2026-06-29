package com.supermarket.management.repository.impl;

import com.supermarket.management.config.TenantContext;
import com.supermarket.management.model.Sale;
import com.supermarket.management.repository.SaleRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
@Profile("rds")
public class PostgresSaleRepository implements SaleRepository {

    private final JdbcTemplate jdbcTemplate;

    public PostgresSaleRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Sale> rowMapper = new RowMapper<Sale>() {
        @Override
        public Sale mapRow(ResultSet rs, int rowNum) throws SQLException {
            Sale s = new Sale();
            s.setBillId(rs.getString("billId"));
            s.setProductId(rs.getString("productId"));
            s.setQuantitySold(rs.getInt("quantitySold"));
            s.setSaleDate(rs.getString("saleDate"));
            s.setTotalAmount(rs.getDouble("totalAmount"));
            s.setProductName(rs.getString("productName"));
            s.setPrice(rs.getDouble("price"));
            s.setOriginalLineTotal(rs.getDouble("originalLineTotal"));
            s.setDiscountApplied(rs.getDouble("discountApplied"));
            s.setCustomerMobile(rs.getString("customerMobile"));
            s.setCustomerName(rs.getString("customerName"));
            s.setPointsEarned(rs.getInt("pointsEarned"));
            s.setTotalPoints(rs.getInt("totalPoints"));
            s.setSubtotal(rs.getDouble("subtotal"));
            s.setDiscount(rs.getDouble("discount"));
            s.setTax(rs.getDouble("tax"));
            s.setFinalAmount(rs.getDouble("finalAmount"));
            return s;
        }
    };

    @Override
    public List<Sale> findAll() {
        String tenant = TenantContext.getCurrentTenant();
        return jdbcTemplate.query(
                "SELECT billId, productId, quantitySold, saleDate, totalAmount, productName, price, originalLineTotal, discountApplied, customerMobile, customerName, pointsEarned, totalPoints, subtotal, discount, tax, finalAmount FROM sales WHERE business_id = ?",
                rowMapper,
                tenant
        );
    }

    @Override
    public List<Sale> findByBillId(String billId) {
        String tenant = TenantContext.getCurrentTenant();
        return jdbcTemplate.query(
                "SELECT billId, productId, quantitySold, saleDate, totalAmount, productName, price, originalLineTotal, discountApplied, customerMobile, customerName, pointsEarned, totalPoints, subtotal, discount, tax, finalAmount FROM sales WHERE billId = ? AND business_id = ?",
                rowMapper,
                billId,
                tenant
        );
    }

    @Override
    public Sale save(Sale sale) {
        String tenant = TenantContext.getCurrentTenant();
        // Since billId + productId + business_id is the primary key:
        int count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sales WHERE billId = ? AND productId = ? AND business_id = ?",
                Integer.class,
                sale.getBillId(),
                sale.getProductId(),
                tenant
        );

        if (count > 0) {
            jdbcTemplate.update(
                    "UPDATE sales SET quantitySold = ?, saleDate = ?, totalAmount = ?, productName = ?, price = ?, originalLineTotal = ?, discountApplied = ?, customerMobile = ?, customerName = ?, pointsEarned = ?, totalPoints = ?, subtotal = ?, discount = ?, tax = ?, finalAmount = ? WHERE billId = ? AND productId = ? AND business_id = ?",
                    sale.getQuantitySold(),
                    sale.getSaleDate(),
                    sale.getTotalAmount(),
                    sale.getProductName(),
                    sale.getPrice(),
                    sale.getOriginalLineTotal(),
                    sale.getDiscountApplied(),
                    sale.getCustomerMobile(),
                    sale.getCustomerName(),
                    sale.getPointsEarned(),
                    sale.getTotalPoints(),
                    sale.getSubtotal(),
                    sale.getDiscount(),
                    sale.getTax(),
                    sale.getFinalAmount(),
                    sale.getBillId(),
                    sale.getProductId(),
                    tenant
            );
        } else {
            jdbcTemplate.update(
                    "INSERT INTO sales (billId, productId, quantitySold, saleDate, totalAmount, productName, price, originalLineTotal, discountApplied, customerMobile, customerName, pointsEarned, totalPoints, subtotal, discount, tax, finalAmount, business_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    sale.getBillId(),
                    sale.getProductId(),
                    sale.getQuantitySold(),
                    sale.getSaleDate(),
                    sale.getTotalAmount(),
                    sale.getProductName(),
                    sale.getPrice(),
                    sale.getOriginalLineTotal(),
                    sale.getDiscountApplied(),
                    sale.getCustomerMobile(),
                    sale.getCustomerName(),
                    sale.getPointsEarned(),
                    sale.getTotalPoints(),
                    sale.getSubtotal(),
                    sale.getDiscount(),
                    sale.getTax(),
                    sale.getFinalAmount(),
                    tenant
            );
        }
        return sale;
    }
}

package com.supermarket.management.repository.impl;

import com.supermarket.management.config.TenantContext;
import com.supermarket.management.model.Product;
import com.supermarket.management.repository.ProductRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
@Profile("rds")
public class PostgresProductRepository implements ProductRepository {

    private final JdbcTemplate jdbcTemplate;

    public PostgresProductRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Product> rowMapper = new RowMapper<Product>() {
        @Override
        public Product mapRow(ResultSet rs, int rowNum) throws SQLException {
            Product p = new Product();
            p.setId(rs.getString("id"));
            p.setName(rs.getString("name"));
            p.setBrand(rs.getString("brand"));
            p.setPhotoUrl(rs.getString("photoUrl"));
            p.setMfgDate(rs.getString("mfgDate"));
            p.setExpDate(rs.getString("expDate"));
            p.setArrivingDate(rs.getString("arrivingDate"));
            p.setQuantity(rs.getInt("quantity"));
            p.setPrice(rs.getDouble("price"));
            return p;
        }
    };

    @Override
    public List<Product> findAll() {
        String tenant = TenantContext.getCurrentTenant();
        return jdbcTemplate.query("SELECT id, name, brand, photoUrl, mfgDate, expDate, arrivingDate, quantity, price FROM products WHERE business_id = ?", rowMapper, tenant);
    }

    @Override
    public Optional<Product> findById(String id) {
        String tenant = TenantContext.getCurrentTenant();
        List<Product> list = jdbcTemplate.query(
                "SELECT id, name, brand, photoUrl, mfgDate, expDate, arrivingDate, quantity, price FROM products WHERE id = ? AND business_id = ?",
                rowMapper,
                id,
                tenant
        );
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public Product save(Product product) {
        if (product.getId() == null || product.getId().trim().isEmpty()) {
            product.setId("P" + System.currentTimeMillis());
        }
        
        String tenant = TenantContext.getCurrentTenant();
        Optional<Product> existing = findById(product.getId());
        if (existing.isPresent()) {
            jdbcTemplate.update(
                    "UPDATE products SET name = ?, brand = ?, photoUrl = ?, mfgDate = ?, expDate = ?, arrivingDate = ?, quantity = ?, price = ? WHERE id = ? AND business_id = ?",
                    product.getName(),
                    product.getBrand(),
                    product.getPhotoUrl(),
                    product.getMfgDate(),
                    product.getExpDate(),
                    product.getArrivingDate(),
                    product.getQuantity(),
                    product.getPrice(),
                    product.getId(),
                    tenant
            );
        } else {
            jdbcTemplate.update(
                    "INSERT INTO products (id, name, brand, photoUrl, mfgDate, expDate, arrivingDate, quantity, price, business_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    product.getId(),
                    product.getName(),
                    product.getBrand(),
                    product.getPhotoUrl(),
                    product.getMfgDate(),
                    product.getExpDate(),
                    product.getArrivingDate(),
                    product.getQuantity(),
                    product.getPrice(),
                    tenant
            );
        }
        return product;
    }

    @Override
    public void deleteById(String id) {
        String tenant = TenantContext.getCurrentTenant();
        jdbcTemplate.update("DELETE FROM products WHERE id = ? AND business_id = ?", id, tenant);
    }
}

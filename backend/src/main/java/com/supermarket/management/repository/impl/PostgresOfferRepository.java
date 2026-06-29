package com.supermarket.management.repository.impl;

import com.supermarket.management.config.TenantContext;
import com.supermarket.management.model.Offer;
import com.supermarket.management.repository.OfferRepository;
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
public class PostgresOfferRepository implements OfferRepository {

    private final JdbcTemplate jdbcTemplate;

    public PostgresOfferRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Offer> rowMapper = new RowMapper<Offer>() {
        @Override
        public Offer mapRow(ResultSet rs, int rowNum) throws SQLException {
            Offer o = new Offer();
            o.setOfferId(rs.getString("offerId"));
            o.setProductId(rs.getString("productId"));
            o.setOfferType(rs.getString("offerType"));
            o.setDiscount(rs.getDouble("discount"));
            o.setActive(rs.getBoolean("active"));
            o.setStartDate(rs.getString("startDate"));
            o.setEndDate(rs.getString("endDate"));
            return o;
        }
    };

    @Override
    public List<Offer> findAll() {
        String tenant = TenantContext.getCurrentTenant();
        return jdbcTemplate.query("SELECT offerId, productId, offerType, discount, active, startDate, endDate FROM offers WHERE business_id = ?", rowMapper, tenant);
    }

    @Override
    public Optional<Offer> findById(String id) {
        String tenant = TenantContext.getCurrentTenant();
        List<Offer> list = jdbcTemplate.query(
                "SELECT offerId, productId, offerType, discount, active, startDate, endDate FROM offers WHERE offerId = ? AND business_id = ?",
                rowMapper,
                id,
                tenant
        );
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public Offer save(Offer offer) {
        if (offer.getOfferId() == null || offer.getOfferId().trim().isEmpty()) {
            offer.setOfferId("O" + System.currentTimeMillis());
        }

        String tenant = TenantContext.getCurrentTenant();
        Optional<Offer> existing = findById(offer.getOfferId());
        if (existing.isPresent()) {
            jdbcTemplate.update(
                    "UPDATE offers SET productId = ?, offerType = ?, discount = ?, active = ?, startDate = ?, endDate = ? WHERE offerId = ? AND business_id = ?",
                    offer.getProductId(),
                    offer.getOfferType(),
                    offer.getDiscount(),
                    offer.getActive(),
                    offer.getStartDate(),
                    offer.getEndDate(),
                    offer.getOfferId(),
                    tenant
            );
        } else {
            jdbcTemplate.update(
                    "INSERT INTO offers (offerId, productId, offerType, discount, active, startDate, endDate, business_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    offer.getOfferId(),
                    offer.getProductId(),
                    offer.getOfferType(),
                    offer.getDiscount(),
                    offer.getActive(),
                    offer.getStartDate(),
                    offer.getEndDate(),
                    tenant
            );
        }
        return offer;
    }

    @Override
    public void deleteById(String id) {
        String tenant = TenantContext.getCurrentTenant();
        jdbcTemplate.update("DELETE FROM offers WHERE offerId = ? AND business_id = ?", id, tenant);
    }
}

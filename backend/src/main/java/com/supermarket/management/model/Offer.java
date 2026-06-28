package com.supermarket.management.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

@DynamoDbBean
public class Offer {
    private String offerId;
    private String productId;
    private String offerType;
    private Double discount;
    private Boolean active;
    private String startDate;
    private String endDate;

    public Offer() {
    }

    public Offer(String offerId, String productId, String offerType, Double discount, Boolean active, String startDate, String endDate) {
        this.offerId = offerId;
        this.productId = productId;
        this.offerType = offerType;
        this.discount = discount;
        this.active = active;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    @DynamoDbPartitionKey
    @DynamoDbAttribute("offer_id")
    public String getOfferId() {
        return offerId;
    }

    public void setOfferId(String offerId) {
        this.offerId = offerId;
    }

    @DynamoDbAttribute("product_id")
    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    @DynamoDbAttribute("offer_type")
    public String getOfferType() {
        return offerType;
    }

    public void setOfferType(String offerType) {
        this.offerType = offerType;
    }

    @DynamoDbAttribute("discount")
    public Double getDiscount() {
        return discount;
    }

    public void setDiscount(Double discount) {
        this.discount = discount;
    }

    @DynamoDbAttribute("active")
    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    @DynamoDbAttribute("start_date")
    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    @DynamoDbAttribute("end_date")
    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public static OfferBuilder builder() {
        return new OfferBuilder();
    }

    public static class OfferBuilder {
        private String offerId;
        private String productId;
        private String offerType;
        private Double discount;
        private Boolean active;
        private String startDate;
        private String endDate;

        public OfferBuilder offerId(String offerId) {
            this.offerId = offerId;
            return this;
        }

        public OfferBuilder productId(String productId) {
            this.productId = productId;
            return this;
        }

        public OfferBuilder offerType(String offerType) {
            this.offerType = offerType;
            return this;
        }

        public OfferBuilder discount(Double discount) {
            this.discount = discount;
            return this;
        }

        public OfferBuilder active(Boolean active) {
            this.active = active;
            return this;
        }

        public OfferBuilder startDate(String startDate) {
            this.startDate = startDate;
            return this;
        }

        public OfferBuilder endDate(String endDate) {
            this.endDate = endDate;
            return this;
        }

        public Offer build() {
            return new Offer(offerId, productId, offerType, discount, active, startDate, endDate);
        }
    }
}

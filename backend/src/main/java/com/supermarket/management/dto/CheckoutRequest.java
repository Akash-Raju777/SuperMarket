package com.supermarket.management.dto;

import java.util.List;

public class CheckoutRequest {
    private String customerMobile;
    private String customerName;
    private List<CheckoutItem> items;
    private Boolean redeemPoints;

    public CheckoutRequest() {
    }

    public CheckoutRequest(String customerMobile, String customerName, List<CheckoutItem> items, Boolean redeemPoints) {
        this.customerMobile = customerMobile;
        this.customerName = customerName;
        this.items = items;
        this.redeemPoints = redeemPoints;
    }

    public String getCustomerMobile() {
        return customerMobile;
    }

    public void setCustomerMobile(String customerMobile) {
        this.customerMobile = customerMobile;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public List<CheckoutItem> getItems() {
        return items;
    }

    public void setItems(List<CheckoutItem> items) {
        this.items = items;
    }

    public Boolean getRedeemPoints() {
        return redeemPoints;
    }

    public void setRedeemPoints(Boolean redeemPoints) {
        this.redeemPoints = redeemPoints;
    }

    public static class CheckoutItem {
        private String productId;
        private Integer quantity;
        private String offerId;

        public CheckoutItem() {
        }

        public CheckoutItem(String productId, Integer quantity, String offerId) {
            this.productId = productId;
            this.quantity = quantity;
            this.offerId = offerId;
        }

        public String getProductId() {
            return productId;
        }

        public void setProductId(String productId) {
            this.productId = productId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public String getOfferId() {
            return offerId;
        }

        public void setOfferId(String offerId) {
            this.offerId = offerId;
        }
    }
}

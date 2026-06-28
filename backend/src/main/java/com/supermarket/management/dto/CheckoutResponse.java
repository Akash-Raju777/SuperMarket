package com.supermarket.management.dto;

import java.util.List;

public class CheckoutResponse {
    private String billId;
    private String customerMobile;
    private String customerName;
    private Integer pointsEarned;
    private Integer totalPoints;
    private String saleDate;
    private List<InvoiceItem> items;
    private Double subtotal;
    private Double discount;
    private Double tax;
    private Double finalAmount;

    public CheckoutResponse() {
    }

    public CheckoutResponse(String billId, String customerMobile, String customerName, Integer pointsEarned, Integer totalPoints, String saleDate, List<InvoiceItem> items, Double subtotal, Double discount, Double tax, Double finalAmount) {
        this.billId = billId;
        this.customerMobile = customerMobile;
        this.customerName = customerName;
        this.pointsEarned = pointsEarned;
        this.totalPoints = totalPoints;
        this.saleDate = saleDate;
        this.items = items;
        this.subtotal = subtotal;
        this.discount = discount;
        this.tax = tax;
        this.finalAmount = finalAmount;
    }

    public String getBillId() {
        return billId;
    }

    public void setBillId(String billId) {
        this.billId = billId;
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

    public Integer getPointsEarned() {
        return pointsEarned;
    }

    public void setPointsEarned(Integer pointsEarned) {
        this.pointsEarned = pointsEarned;
    }

    public Integer getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(Integer totalPoints) {
        this.totalPoints = totalPoints;
    }

    public String getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(String saleDate) {
        this.saleDate = saleDate;
    }

    public List<InvoiceItem> getItems() {
        return items;
    }

    public void setItems(List<InvoiceItem> items) {
        this.items = items;
    }

    public Double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }

    public Double getDiscount() {
        return discount;
    }

    public void setDiscount(Double discount) {
        this.discount = discount;
    }

    public Double getTax() {
        return tax;
    }

    public void setTax(Double tax) {
        this.tax = tax;
    }

    public Double getFinalAmount() {
        return finalAmount;
    }

    public void setFinalAmount(Double finalAmount) {
        this.finalAmount = finalAmount;
    }

    public static CheckoutResponseBuilder builder() {
        return new CheckoutResponseBuilder();
    }

    public static class CheckoutResponseBuilder {
        private String billId;
        private String customerMobile;
        private String customerName;
        private Integer pointsEarned;
        private Integer totalPoints;
        private String saleDate;
        private List<InvoiceItem> items;
        private Double subtotal;
        private Double discount;
        private Double tax;
        private Double finalAmount;

        public CheckoutResponseBuilder billId(String billId) {
            this.billId = billId;
            return this;
        }

        public CheckoutResponseBuilder customerMobile(String customerMobile) {
            this.customerMobile = customerMobile;
            return this;
        }

        public CheckoutResponseBuilder customerName(String customerName) {
            this.customerName = customerName;
            return this;
        }

        public CheckoutResponseBuilder pointsEarned(Integer pointsEarned) {
            this.pointsEarned = pointsEarned;
            return this;
        }

        public CheckoutResponseBuilder totalPoints(Integer totalPoints) {
            this.totalPoints = totalPoints;
            return this;
        }

        public CheckoutResponseBuilder saleDate(String saleDate) {
            this.saleDate = saleDate;
            return this;
        }

        public CheckoutResponseBuilder items(List<InvoiceItem> items) {
            this.items = items;
            return this;
        }

        public CheckoutResponseBuilder subtotal(Double subtotal) {
            this.subtotal = subtotal;
            return this;
        }

        public CheckoutResponseBuilder discount(Double discount) {
            this.discount = discount;
            return this;
        }

        public CheckoutResponseBuilder tax(Double tax) {
            this.tax = tax;
            return this;
        }

        public CheckoutResponseBuilder finalAmount(Double finalAmount) {
            this.finalAmount = finalAmount;
            return this;
        }

        public CheckoutResponse build() {
            return new CheckoutResponse(billId, customerMobile, customerName, pointsEarned, totalPoints, saleDate, items, subtotal, discount, tax, finalAmount);
        }
    }

    public static class InvoiceItem {
        private String productId;
        private String productName;
        private Integer quantity;
        private Double price;
        private Double originalLineTotal;
        private Double discountApplied;
        private Double finalLineTotal;

        public InvoiceItem() {
        }

        public InvoiceItem(String productId, String productName, Integer quantity, Double price, Double originalLineTotal, Double discountApplied, Double finalLineTotal) {
            this.productId = productId;
            this.productName = productName;
            this.quantity = quantity;
            this.price = price;
            this.originalLineTotal = originalLineTotal;
            this.discountApplied = discountApplied;
            this.finalLineTotal = finalLineTotal;
        }

        public String getProductId() {
            return productId;
        }

        public void setProductId(String productId) {
            this.productId = productId;
        }

        public String getProductName() {
            return productName;
        }

        public void setProductName(String productName) {
            this.productName = productName;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public Double getPrice() {
            return price;
        }

        public void setPrice(Double price) {
            this.price = price;
        }

        public Double getOriginalLineTotal() {
            return originalLineTotal;
        }

        public void setOriginalLineTotal(Double originalLineTotal) {
            this.originalLineTotal = originalLineTotal;
        }

        public Double getDiscountApplied() {
            return discountApplied;
        }

        public void setDiscountApplied(Double discountApplied) {
            this.discountApplied = discountApplied;
        }

        public Double getFinalLineTotal() {
            return finalLineTotal;
        }

        public void setFinalLineTotal(Double finalLineTotal) {
            this.finalLineTotal = finalLineTotal;
        }

        public static InvoiceItemBuilder builder() {
            return new InvoiceItemBuilder();
        }

        public static class InvoiceItemBuilder {
            private String productId;
            private String productName;
            private Integer quantity;
            private Double price;
            private Double originalLineTotal;
            private Double discountApplied;
            private Double finalLineTotal;

            public InvoiceItemBuilder productId(String productId) {
                this.productId = productId;
                return this;
            }

            public InvoiceItemBuilder productName(String productName) {
                this.productName = productName;
                return this;
            }

            public InvoiceItemBuilder quantity(Integer quantity) {
                this.quantity = quantity;
                return this;
            }

            public InvoiceItemBuilder price(Double price) {
                this.price = price;
                return this;
            }

            public InvoiceItemBuilder originalLineTotal(Double originalLineTotal) {
                this.originalLineTotal = originalLineTotal;
                return this;
            }

            public InvoiceItemBuilder discountApplied(Double discountApplied) {
                this.discountApplied = discountApplied;
                return this;
            }

            public InvoiceItemBuilder finalLineTotal(Double finalLineTotal) {
                this.finalLineTotal = finalLineTotal;
                return this;
            }

            public InvoiceItem build() {
                return new InvoiceItem(productId, productName, quantity, price, originalLineTotal, discountApplied, finalLineTotal);
            }
        }
    }
}

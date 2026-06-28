package com.supermarket.management.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

@DynamoDbBean
public class Sale {
    private String billId;
    private String productId;
    private Integer quantitySold;
    private String saleDate;
    private Double totalAmount;
    
    // Detailed Metadata Fields for "See All Bills" option
    private String productName;
    private Double price;
    private Double originalLineTotal;
    private Double discountApplied;
    private String customerMobile;
    private String customerName;
    private Integer pointsEarned;
    private Integer totalPoints;
    private Double subtotal;
    private Double discount;
    private Double tax;
    private Double finalAmount;

    public Sale() {
    }

    public Sale(String billId, String productId, Integer quantitySold, String saleDate, Double totalAmount) {
        this.billId = billId;
        this.productId = productId;
        this.quantitySold = quantitySold;
        this.saleDate = saleDate;
        this.totalAmount = totalAmount;
    }

    @DynamoDbPartitionKey
    @DynamoDbAttribute("bill_id")
    public String getBillId() {
        return billId;
    }

    public void setBillId(String billId) {
        this.billId = billId;
    }

    @DynamoDbSortKey
    @DynamoDbAttribute("product_id")
    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    @DynamoDbAttribute("quantity_sold")
    public Integer getQuantitySold() {
        return quantitySold;
    }

    public void setQuantitySold(Integer quantitySold) {
        this.quantitySold = quantitySold;
    }

    @DynamoDbAttribute("sale_date")
    public String getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(String saleDate) {
        this.saleDate = saleDate;
    }

    @DynamoDbAttribute("total_amount")
    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    @DynamoDbAttribute("product_name")
    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    @DynamoDbAttribute("price")
    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    @DynamoDbAttribute("original_line_total")
    public Double getOriginalLineTotal() {
        return originalLineTotal;
    }

    public void setOriginalLineTotal(Double originalLineTotal) {
        this.originalLineTotal = originalLineTotal;
    }

    @DynamoDbAttribute("discount_applied")
    public Double getDiscountApplied() {
        return discountApplied;
    }

    public void setDiscountApplied(Double discountApplied) {
        this.discountApplied = discountApplied;
    }

    @DynamoDbAttribute("customer_mobile")
    public String getCustomerMobile() {
        return customerMobile;
    }

    public void setCustomerMobile(String customerMobile) {
        this.customerMobile = customerMobile;
    }

    @DynamoDbAttribute("customer_name")
    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    @DynamoDbAttribute("points_earned")
    public Integer getPointsEarned() {
        return pointsEarned;
    }

    public void setPointsEarned(Integer pointsEarned) {
        this.pointsEarned = pointsEarned;
    }

    @DynamoDbAttribute("total_points")
    public Integer getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(Integer totalPoints) {
        this.totalPoints = totalPoints;
    }

    @DynamoDbAttribute("subtotal")
    public Double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }

    @DynamoDbAttribute("discount")
    public Double getDiscount() {
        return discount;
    }

    public void setDiscount(Double discount) {
        this.discount = discount;
    }

    @DynamoDbAttribute("tax")
    public Double getTax() {
        return tax;
    }

    public void setTax(Double tax) {
        this.tax = tax;
    }

    @DynamoDbAttribute("final_amount")
    public Double getFinalAmount() {
        return finalAmount;
    }

    public void setFinalAmount(Double finalAmount) {
        this.finalAmount = finalAmount;
    }

    public static SaleBuilder builder() {
        return new SaleBuilder();
    }

    public static class SaleBuilder {
        private String billId;
        private String productId;
        private Integer quantitySold;
        private String saleDate;
        private Double totalAmount;
        private String productName;
        private Double price;
        private Double originalLineTotal;
        private Double discountApplied;
        private String customerMobile;
        private String customerName;
        private Integer pointsEarned;
        private Integer totalPoints;
        private Double subtotal;
        private Double discount;
        private Double tax;
        private Double finalAmount;

        public SaleBuilder billId(String billId) {
            this.billId = billId;
            return this;
        }

        public SaleBuilder productId(String productId) {
            this.productId = productId;
            return this;
        }

        public SaleBuilder quantitySold(Integer quantitySold) {
            this.quantitySold = quantitySold;
            return this;
        }

        public SaleBuilder saleDate(String saleDate) {
            this.saleDate = saleDate;
            return this;
        }

        public SaleBuilder totalAmount(Double totalAmount) {
            this.totalAmount = totalAmount;
            return this;
        }

        public SaleBuilder productName(String productName) {
            this.productName = productName;
            return this;
        }

        public SaleBuilder price(Double price) {
            this.price = price;
            return this;
        }

        public SaleBuilder originalLineTotal(Double originalLineTotal) {
            this.originalLineTotal = originalLineTotal;
            return this;
        }

        public SaleBuilder discountApplied(Double discountApplied) {
            this.discountApplied = discountApplied;
            return this;
        }

        public SaleBuilder customerMobile(String customerMobile) {
            this.customerMobile = customerMobile;
            return this;
        }

        public SaleBuilder customerName(String customerName) {
            this.customerName = customerName;
            return this;
        }

        public SaleBuilder pointsEarned(Integer pointsEarned) {
            this.pointsEarned = pointsEarned;
            return this;
        }

        public SaleBuilder totalPoints(Integer totalPoints) {
            this.totalPoints = totalPoints;
            return this;
        }

        public SaleBuilder subtotal(Double subtotal) {
            this.subtotal = subtotal;
            return this;
        }

        public SaleBuilder discount(Double discount) {
            this.discount = discount;
            return this;
        }

        public SaleBuilder tax(Double tax) {
            this.tax = tax;
            return this;
        }

        public SaleBuilder finalAmount(Double finalAmount) {
            this.finalAmount = finalAmount;
            return this;
        }

        public Sale build() {
            Sale sale = new Sale(billId, productId, quantitySold, saleDate, totalAmount);
            sale.setProductName(productName);
            sale.setPrice(price);
            sale.setOriginalLineTotal(originalLineTotal);
            sale.setDiscountApplied(discountApplied);
            sale.setCustomerMobile(customerMobile);
            sale.setCustomerName(customerName);
            sale.setPointsEarned(pointsEarned);
            sale.setTotalPoints(totalPoints);
            sale.setSubtotal(subtotal);
            sale.setDiscount(discount);
            sale.setTax(tax);
            sale.setFinalAmount(finalAmount);
            return sale;
        }
    }
}


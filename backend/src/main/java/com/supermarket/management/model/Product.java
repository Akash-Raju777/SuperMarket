package com.supermarket.management.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

@DynamoDbBean
public class Product {
    private String id;
    private String name;
    private String brand;
    private String photoUrl;
    private String mfgDate;
    private String expDate;
    private String arrivingDate;
    private Integer quantity;
    private Double price;

    public Product() {
    }

    public Product(String id, String name, String brand, String photoUrl, String mfgDate, String expDate, String arrivingDate, Integer quantity, Double price) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.photoUrl = photoUrl;
        this.mfgDate = mfgDate;
        this.expDate = expDate;
        this.arrivingDate = arrivingDate;
        this.quantity = quantity;
        this.price = price;
    }

    @DynamoDbPartitionKey
    @DynamoDbAttribute("id")
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @DynamoDbAttribute("name")
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @DynamoDbAttribute("brand")
    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    @DynamoDbAttribute("photo_url")
    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    @DynamoDbAttribute("mfg_date")
    public String getMfgDate() {
        return mfgDate;
    }

    public void setMfgDate(String mfgDate) {
        this.mfgDate = mfgDate;
    }

    @DynamoDbAttribute("exp_date")
    public String getExpDate() {
        return expDate;
    }

    public void setExpDate(String expDate) {
        this.expDate = expDate;
    }

    @DynamoDbAttribute("arriving_date")
    public String getArrivingDate() {
        return arrivingDate;
    }

    public void setArrivingDate(String arrivingDate) {
        this.arrivingDate = arrivingDate;
    }

    @DynamoDbAttribute("quantity")
    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    @DynamoDbAttribute("price")
    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public static ProductBuilder builder() {
        return new ProductBuilder();
    }

    public static class ProductBuilder {
        private String id;
        private String name;
        private String brand;
        private String photoUrl;
        private String mfgDate;
        private String expDate;
        private String arrivingDate;
        private Integer quantity;
        private Double price;

        public ProductBuilder id(String id) {
            this.id = id;
            return this;
        }

        public ProductBuilder name(String name) {
            this.name = name;
            return this;
        }

        public ProductBuilder brand(String brand) {
            this.brand = brand;
            return this;
        }

        public ProductBuilder photoUrl(String photoUrl) {
            this.photoUrl = photoUrl;
            return this;
        }

        public ProductBuilder mfgDate(String mfgDate) {
            this.mfgDate = mfgDate;
            return this;
        }

        public ProductBuilder expDate(String expDate) {
            this.expDate = expDate;
            return this;
        }

        public ProductBuilder arrivingDate(String arrivingDate) {
            this.arrivingDate = arrivingDate;
            return this;
        }

        public ProductBuilder quantity(Integer quantity) {
            this.quantity = quantity;
            return this;
        }

        public ProductBuilder price(Double price) {
            this.price = price;
            return this;
        }

        public Product build() {
            return new Product(id, name, brand, photoUrl, mfgDate, expDate, arrivingDate, quantity, price);
        }
    }
}

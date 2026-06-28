package com.supermarket.management.dto;

public class CustomerResponse {
    private String mobile;
    private String name;
    private Integer points;
    private Boolean exists;

    public CustomerResponse() {
    }

    public CustomerResponse(String mobile, String name, Integer points, Boolean exists) {
        this.mobile = mobile;
        this.name = name;
        this.points = points;
        this.exists = exists;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public Boolean getExists() {
        return exists;
    }

    public void setExists(Boolean exists) {
        this.exists = exists;
    }
}

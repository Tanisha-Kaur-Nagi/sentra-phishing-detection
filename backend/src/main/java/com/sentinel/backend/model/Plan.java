package com.sentinel.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "plans")
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Integer pricePerMonth;
    private Integer scansPerDay;   // null = unlimited
    private Integer seats;
    private Boolean apiAccess;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getPricePerMonth() { return pricePerMonth; }
    public void setPricePerMonth(Integer pricePerMonth) { this.pricePerMonth = pricePerMonth; }

    public Integer getScansPerDay() { return scansPerDay; }
    public void setScansPerDay(Integer scansPerDay) { this.scansPerDay = scansPerDay; }

    public Integer getSeats() { return seats; }
    public void setSeats(Integer seats) { this.seats = seats; }

    public Boolean getApiAccess() { return apiAccess; }
    public void setApiAccess(Boolean apiAccess) { this.apiAccess = apiAccess; }
}
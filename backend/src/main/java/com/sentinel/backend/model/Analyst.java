package com.sentinel.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "analysts")
public class Analyst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String specialization = "GENERAL"; // PHISHING / MALWARE / GENERAL

    @Enumerated(EnumType.STRING)
    private Level level = Level.JUNIOR;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    private Double perReviewRate = 10.0; // rupees paid per review

    private LocalDateTime joinedAt = LocalDateTime.now();

    public enum Level { JUNIOR, SENIOR }
    public enum Status { ACTIVE, ON_LEAVE }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public Level getLevel() { return level; }
    public void setLevel(Level level) { this.level = level; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Double getPerReviewRate() { return perReviewRate; }
    public void setPerReviewRate(Double perReviewRate) { this.perReviewRate = perReviewRate; }

    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}
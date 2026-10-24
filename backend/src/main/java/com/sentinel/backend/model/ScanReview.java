package com.sentinel.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scan_reviews",
       uniqueConstraints = @UniqueConstraint(columnNames = {"scan_id", "analyst_id"}))
public class ScanReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "scan_id", nullable = false)
    private Scan scan;

    @ManyToOne
    @JoinColumn(name = "analyst_id", nullable = false)
    private Analyst analyst;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Scan.Verdict decision; // SAFE or MALICIOUS only

    @Column(length = 1000)
    private String comment;

    private Integer timeSpentSeconds;

    private LocalDateTime reviewedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Scan getScan() { return scan; }
    public void setScan(Scan scan) { this.scan = scan; }

    public Analyst getAnalyst() { return analyst; }
    public void setAnalyst(Analyst analyst) { this.analyst = analyst; }

    public Scan.Verdict getDecision() { return decision; }
    public void setDecision(Scan.Verdict decision) { this.decision = decision; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Integer getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(Integer timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
package com.sentinel.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scans")
public class Scan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type; // "URL" or "FILE"

    @Column(nullable = false, length = 1000)
    private String target;

    @Enumerated(EnumType.STRING)
    private Verdict verdict; // SAFE, SUSPICIOUS, MALICIOUS

    // NEW: the ML model's original verdict, never overwritten by analysts
    @Enumerated(EnumType.STRING)
    private Verdict modelVerdict;

    private Double confidence;

    @Column(length = 2000)
    private String reasons;

    private boolean reviewed = false;

    @Enumerated(EnumType.STRING)
    private Verdict finalVerdict;

    @Transient
    private int voteCount;

    @ManyToOne
    @JoinColumn(name = "submitted_by")
    private User submittedBy;

    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Verdict { SAFE, SUSPICIOUS, MALICIOUS }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }

    public Verdict getVerdict() { return verdict; }
    public void setVerdict(Verdict verdict) { this.verdict = verdict; }

    public Verdict getModelVerdict() { return modelVerdict; }
    public void setModelVerdict(Verdict modelVerdict) { this.modelVerdict = modelVerdict; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getReasons() { return reasons; }
    public void setReasons(String reasons) { this.reasons = reasons; }

    public boolean isReviewed() { return reviewed; }
    public void setReviewed(boolean reviewed) { this.reviewed = reviewed; }

    public Verdict getFinalVerdict() { return finalVerdict; }
    public void setFinalVerdict(Verdict finalVerdict) { this.finalVerdict = finalVerdict; }

    public int getVoteCount() { return voteCount; }
    public void setVoteCount(int voteCount) { this.voteCount = voteCount; }

    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }

    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
package com.sentinel.backend.repository;

import com.sentinel.backend.model.Analyst;
import com.sentinel.backend.model.Scan;
import com.sentinel.backend.model.ScanReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScanReviewRepository extends JpaRepository<ScanReview, Long> {
    List<ScanReview> findByScan(Scan scan);
    List<ScanReview> findByAnalyst(Analyst analyst);
    long countByScan(Scan scan);
    boolean existsByScanAndAnalyst(Scan scan, Analyst analyst);
}
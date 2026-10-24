package com.sentinel.backend.repository;

import com.sentinel.backend.model.Scan;
import com.sentinel.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScanRepository extends JpaRepository<Scan, Long> {
    List<Scan> findByReviewedFalse();
    List<Scan> findBySubmittedById(Long userId);
    List<Scan> findBySubmittedBy(User user);
}
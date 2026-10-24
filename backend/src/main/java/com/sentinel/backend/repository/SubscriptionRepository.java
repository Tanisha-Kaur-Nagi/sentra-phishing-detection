package com.sentinel.backend.repository;

import com.sentinel.backend.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findFirstByUserIdAndStatusOrderByStartedAtDesc(Long userId, String status);

    // Counts how many scans this user made today
    @Query(value = "SELECT COUNT(*) FROM scans WHERE submitted_by = :userId AND created_at >= CURDATE()", nativeQuery = true)
    long countScansToday(@Param("userId") Long userId);

    // Counts active, not-expired subscribers of one plan
    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.planId = :planId AND s.status = 'ACTIVE' AND (s.endsAt IS NULL OR s.endsAt > CURRENT_TIMESTAMP)")
    long countActiveByPlan(@Param("planId") Long planId);
}
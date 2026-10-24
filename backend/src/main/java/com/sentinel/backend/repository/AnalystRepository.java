package com.sentinel.backend.repository;

import com.sentinel.backend.model.Analyst;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AnalystRepository extends JpaRepository<Analyst, Long> {
    Optional<Analyst> findByUserId(Long userId);
}
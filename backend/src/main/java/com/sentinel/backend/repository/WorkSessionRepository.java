package com.sentinel.backend.repository;

import com.sentinel.backend.model.Analyst;
import com.sentinel.backend.model.WorkSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WorkSessionRepository extends JpaRepository<WorkSession, Long> {
    List<WorkSession> findByAnalyst(Analyst analyst);
    Optional<WorkSession> findFirstByAnalystAndEndedAtIsNull(Analyst analyst);
}
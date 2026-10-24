package com.sentinel.backend.controller;

import com.sentinel.backend.service.MlClient;
import com.sentinel.backend.dto.ReviewRequest;
import com.sentinel.backend.dto.ScanRequest;
import com.sentinel.backend.model.Plan;
import com.sentinel.backend.model.Role;
import com.sentinel.backend.model.Scan;
import com.sentinel.backend.model.Subscription;
import com.sentinel.backend.model.User;
import com.sentinel.backend.repository.PlanRepository;
import com.sentinel.backend.repository.ScanRepository;
import com.sentinel.backend.repository.SubscriptionRepository;
import com.sentinel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/scans")
@CrossOrigin(origins = "http://localhost:5173")
public class ScanController {

    @Autowired
    private ScanRepository scanRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MlClient mlClient;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    // Finds the plan a user is on. No active subscription = Free plan.
    private Optional<Plan> findPlanForUser(Long userId) {
        Optional<Subscription> subOpt = subscriptionRepository
                .findFirstByUserIdAndStatusOrderByStartedAtDesc(userId, "ACTIVE");
        if (subOpt.isPresent()) {
            Subscription sub = subOpt.get();
            boolean expired = sub.getEndsAt() != null && sub.getEndsAt().isBefore(LocalDateTime.now());
            if (!expired) {
                Optional<Plan> paid = planRepository.findById(sub.getPlanId());
                if (paid.isPresent()) {
                    return paid;
                }
            }
        }
        return planRepository.findByName("Free");
    }

    // GET /api/scans/usage/{userId} — plan name, daily limit, scans used today
    @GetMapping("/usage/{userId}")
    public ResponseEntity<?> getUsage(@PathVariable Long userId) {
        Optional<Plan> planOpt = findPlanForUser(userId);
        if (planOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Plan not found"));
        }
        Plan plan = planOpt.get();
        Map<String, Object> result = new HashMap<>();
        result.put("plan", plan.getName());
        result.put("limit", plan.getScansPerDay());   // null = unlimited
        result.put("usedToday", subscriptionRepository.countScansToday(userId));
        return ResponseEntity.ok(result);
    }

    // POST /api/scans — user submits a URL or file
    @PostMapping
    public ResponseEntity<?> submitScan(@RequestBody ScanRequest request) {
        Optional<User> userOpt = userRepository.findById(request.getUserId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }

        // Daily limit check (only for normal users, not analysts or admins)
        if (userOpt.get().getRole() == Role.USER) {
            Optional<Plan> planOpt = findPlanForUser(request.getUserId());
            if (planOpt.isPresent() && planOpt.get().getScansPerDay() != null) {
                int limit = planOpt.get().getScansPerDay();
                long used = subscriptionRepository.countScansToday(request.getUserId());
                if (used >= limit) {
                    return ResponseEntity.status(429).body(Map.of("error",
                            "Daily limit reached (" + limit + " scans on the "
                                    + planOpt.get().getName() + " plan). Upgrade to scan more."));
                }
            }
        }

        Scan scan = new Scan();
        scan.setType(request.getType());
        scan.setTarget(request.getTarget());
        scan.setSubmittedBy(userOpt.get());

        boolean usedMl = false;
        if ("URL".equalsIgnoreCase(request.getType())) {
            Optional<MlClient.MlResult> ml = mlClient.predict(request.getTarget());
            if (ml.isPresent()) {
                try {
                    Scan.Verdict v = Scan.Verdict.valueOf(ml.get().verdict());
                    scan.setVerdict(v);
                    scan.setModelVerdict(v);
                    scan.setConfidence(ml.get().confidence());
                    scan.setReasons(ml.get().reasons());
                    usedMl = true;
                } catch (IllegalArgumentException ignored) { }
            }
        }

        if (!usedMl) {
            // FALLBACK: old rule-based logic (ML service down or non-URL scan)
            String lower = request.getTarget().toLowerCase();
            if (lower.matches(".*(login|verify|reset|secure|bit\\.ly|paypa1|\\.exe).*")) {
                scan.setVerdict(Scan.Verdict.MALICIOUS);
                scan.setConfidence(92.0 + (request.getTarget().length() % 7));
            } else if (lower.matches(".*(192\\.168|free|claim).*")) {
                scan.setVerdict(Scan.Verdict.SUSPICIOUS);
                scan.setConfidence(55.0 + (request.getTarget().length() % 15));
            } else {
                scan.setVerdict(Scan.Verdict.SAFE);
                scan.setConfidence(88.0 + (request.getTarget().length() % 11));
            }
            scan.setReasons("ML service unavailable - rule-based fallback used");
        }
        // Suspicious verdicts go to the analyst queue automatically
        scan.setReviewed(scan.getVerdict() != Scan.Verdict.SUSPICIOUS);

        scanRepository.save(scan);
        return ResponseEntity.ok(scan);
    }

    // GET /api/scans/user/{userId} — powers a user's scan history table
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserScans(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        List<Scan> scans = scanRepository.findBySubmittedBy(userOpt.get());
        return ResponseEntity.ok(scans);
    }

    // GET /api/scans/queue — powers the Analyst dashboard's review queue
    @GetMapping("/queue")
    public ResponseEntity<?> getQueue() {
        return ResponseEntity.ok(scanRepository.findByReviewedFalse());
    }

    // PUT /api/scans/{id}/review — analyst confirms or corrects a verdict
    @PutMapping("/{id}/review")
    public ResponseEntity<?> reviewScan(@PathVariable Long id, @RequestBody ReviewRequest request) {
        Optional<Scan> scanOpt = scanRepository.findById(id);
        if (scanOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Scan not found"));
        }
        Optional<User> analystOpt = userRepository.findById(request.getAnalystId());
        if (analystOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Analyst not found"));
        }

        Scan scan = scanOpt.get();
        scan.setVerdict(Scan.Verdict.valueOf(request.getDecision().toUpperCase()));
        scan.setReviewed(true);
        scan.setReviewedBy(analystOpt.get());
        scanRepository.save(scan);

        return ResponseEntity.ok(scan);
    }
}
package com.sentinel.backend.controller;

import com.sentinel.backend.dto.ReviewRequest;
import com.sentinel.backend.model.*;
import com.sentinel.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/analyst")
@CrossOrigin(origins = "http://localhost:5173")
public class AnalystController {

    private static final int REQUIRED_VOTES = 3;

    @Autowired private ScanRepository scanRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AnalystRepository analystRepository;
    @Autowired private ScanReviewRepository reviewRepository;
    @Autowired private WorkSessionRepository sessionRepository;

    private Analyst getOrCreateAnalyst(Long userId) {
        if (userId == null) return null;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getRole() != Role.ANALYST) return null;
        return analystRepository.findByUserId(userId).orElseGet(() -> {
            Analyst a = new Analyst();
            a.setUser(user);
            return analystRepository.save(a);
        });
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    @GetMapping("/queue")
    public ResponseEntity<?> getQueue(@RequestParam(required = false) Long analystId) {
        Analyst analyst = getOrCreateAnalyst(analystId);
        List<Scan> result = new ArrayList<>();
        for (Scan s : scanRepository.findByReviewedFalse()) {
            if (analyst != null && reviewRepository.existsByScanAndAnalyst(s, analyst)) continue;
            s.setVoteCount((int) reviewRepository.countByScan(s));
            result.add(s);
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/review/{scanId}")
    public ResponseEntity<?> review(@PathVariable Long scanId, @RequestBody ReviewRequest request) {
        Scan scan = scanRepository.findById(scanId).orElse(null);
        if (scan == null) return ResponseEntity.badRequest().body(Map.of("error", "Scan not found"));
        if (scan.isReviewed()) return ResponseEntity.badRequest().body(Map.of("error", "This scan is already resolved"));

        Analyst analyst = getOrCreateAnalyst(request.getAnalystId());
        if (analyst == null) return ResponseEntity.badRequest().body(Map.of("error", "Only analyst accounts can review"));
        if (analyst.getStatus() == Analyst.Status.ON_LEAVE)
            return ResponseEntity.badRequest().body(Map.of("error", "Analyst is on leave"));
        if (reviewRepository.existsByScanAndAnalyst(scan, analyst))
            return ResponseEntity.badRequest().body(Map.of("error", "You already voted on this scan"));

        Scan.Verdict decision;
        try {
            decision = Scan.Verdict.valueOf(request.getDecision().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Decision must be SAFE or MALICIOUS"));
        }
        if (decision == Scan.Verdict.SUSPICIOUS)
            return ResponseEntity.badRequest().body(Map.of("error", "Decision must be SAFE or MALICIOUS"));

        ScanReview review = new ScanReview();
        review.setScan(scan);
        review.setAnalyst(analyst);
        review.setDecision(decision);
        review.setComment(request.getComment());
        review.setTimeSpentSeconds(request.getTimeSpentSeconds());
        reviewRepository.save(review);

        List<ScanReview> votes = reviewRepository.findByScan(scan);
        long malicious = votes.stream().filter(v -> v.getDecision() == Scan.Verdict.MALICIOUS).count();
        long safe = votes.size() - malicious;

        boolean resolved = false;
        if (votes.size() >= REQUIRED_VOTES && malicious != safe) {
            Scan.Verdict finalVerdict = malicious > safe ? Scan.Verdict.MALICIOUS : Scan.Verdict.SAFE;
            scan.setFinalVerdict(finalVerdict);
            scan.setVerdict(finalVerdict);
            scan.setReviewed(true);
            scanRepository.save(scan);
            resolved = true;
        }

        Map<String, Object> response = new HashMap<>();
        response.put("resolved", resolved);
        response.put("votes", votes.size());
        response.put("required", REQUIRED_VOTES);
        response.put("finalVerdict", resolved ? scan.getFinalVerdict().name() : null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{userId}/clock-in")
    public ResponseEntity<?> clockIn(@PathVariable Long userId) {
        Analyst analyst = getOrCreateAnalyst(userId);
        if (analyst == null) return ResponseEntity.badRequest().body(Map.of("error", "Not an analyst account"));
        if (sessionRepository.findFirstByAnalystAndEndedAtIsNull(analyst).isPresent())
            return ResponseEntity.badRequest().body(Map.of("error", "Already clocked in"));

        WorkSession session = new WorkSession();
        session.setAnalyst(analyst);
        session.setStartedAt(LocalDateTime.now());
        sessionRepository.save(session);
        return ResponseEntity.ok(Map.of("message", "Clocked in"));
    }

    @PostMapping("/{userId}/clock-out")
    public ResponseEntity<?> clockOut(@PathVariable Long userId) {
        Analyst analyst = getOrCreateAnalyst(userId);
        if (analyst == null) return ResponseEntity.badRequest().body(Map.of("error", "Not an analyst account"));
        WorkSession session = sessionRepository.findFirstByAnalystAndEndedAtIsNull(analyst).orElse(null);
        if (session == null) return ResponseEntity.badRequest().body(Map.of("error", "You are not clocked in"));

        session.setEndedAt(LocalDateTime.now());
        sessionRepository.save(session);
        return ResponseEntity.ok(Map.of("message", "Clocked out"));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> leaderboard() {
        for (User u : userRepository.findByRole(Role.ANALYST)) getOrCreateAnalyst(u.getId());

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Analyst a : analystRepository.findAll()) {
            List<ScanReview> mine = reviewRepository.findByAnalyst(a);

            long resolved = 0, agreed = 0, totalSeconds = 0;
            int timed = 0;
            for (ScanReview r : mine) {
                Scan s = r.getScan();
                if (s.isReviewed() && s.getFinalVerdict() != null) {
                    resolved++;
                    if (r.getDecision() == s.getFinalVerdict()) agreed++;
                }
                if (r.getTimeSpentSeconds() != null) {
                    totalSeconds += r.getTimeSpentSeconds();
                    timed++;
                }
            }

            double hours = 0;
            for (WorkSession w : sessionRepository.findByAnalyst(a)) {
                LocalDateTime end = w.getEndedAt() != null ? w.getEndedAt() : LocalDateTime.now();
                hours += Duration.between(w.getStartedAt(), end).toMinutes() / 60.0;
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("analystId", a.getId());
            row.put("name", a.getUser().getName());
            row.put("email", a.getUser().getEmail());
            row.put("level", a.getLevel().name());
            row.put("status", a.getStatus().name());
            row.put("totalReviews", mine.size());
            row.put("resolvedReviews", resolved);
            row.put("agreementRate", resolved == 0 ? null : round1(100.0 * agreed / resolved));
            row.put("avgReviewSeconds", timed == 0 ? null : totalSeconds / timed);
            row.put("hoursWorked", round1(hours));
            row.put("earnings", Math.round(mine.size() * a.getPerReviewRate()));
            rows.add(row);
        }
        return ResponseEntity.ok(rows);
    }
}
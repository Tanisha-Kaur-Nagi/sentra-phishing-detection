package com.sentinel.backend.controller;

import com.sentinel.backend.model.Plan;
import com.sentinel.backend.model.Subscription;
import com.sentinel.backend.repository.PlanRepository;
import com.sentinel.backend.repository.SubscriptionRepository;
import com.sentinel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/plans")
@CrossOrigin(origins = "http://localhost:5173")
public class PlanController {

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private UserRepository userRepository;

    // GET /api/plans: list all plans for the pricing page
    @GetMapping
    public ResponseEntity<?> getPlans() {
        List<Plan> plans = planRepository.findAll();
        return ResponseEntity.ok(plans);
    }

    // POST /api/plans/subscribe: only for switching back to Free.
    // Paid plans are activated by /api/payments/verify after a real test payment.
    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        String planName = String.valueOf(body.get("planName"));

        if (userRepository.findById(userId).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        Optional<Plan> planOpt = planRepository.findByName(planName);
        if (planOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Plan not found"));
        }
        if (!"Free".equalsIgnoreCase(planName)) {
            return ResponseEntity.status(402).body(Map.of("error", "Paid plans need a payment"));
        }

        // Switching to Free: cancel the old active subscription (if any)
        Optional<Subscription> old = subscriptionRepository
                .findFirstByUserIdAndStatusOrderByStartedAtDesc(userId, "ACTIVE");
        if (old.isPresent()) {
            Subscription o = old.get();
            o.setStatus("CANCELLED");
            subscriptionRepository.save(o);
        }
        return ResponseEntity.ok(Map.of("plan", "Free", "message", "Switched to Free plan"));
    }
}
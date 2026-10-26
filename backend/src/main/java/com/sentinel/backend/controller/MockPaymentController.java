package com.sentinel.backend.controller;

import com.sentinel.backend.model.Plan;
import com.sentinel.backend.model.Subscription;
import com.sentinel.backend.repository.PlanRepository;
import com.sentinel.backend.repository.SubscriptionRepository;
import com.sentinel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

// DEMO ONLY: simulated checkout. A real gateway would replace this.
@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:5173")
public class MockPaymentController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    // POST /api/payments/mock-pay
    // body: {"userId":3,"planName":"Solo","cardNumber":"4111 1111 1111 1111","expiry":"12/30","cvv":"123"}
    @PostMapping("/mock-pay")
    public ResponseEntity<?> mockPay(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        String planName = String.valueOf(body.get("planName"));
        String card = String.valueOf(body.get("cardNumber")).replaceAll("\\s", "");
        String expiry = String.valueOf(body.get("expiry")).trim();
        String cvv = String.valueOf(body.get("cvv")).trim();

        if (userRepository.findById(userId).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        Optional<Plan> planOpt = planRepository.findByName(planName);
        if (planOpt.isEmpty() || planOpt.get().getPricePerMonth() <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid plan"));
        }
        if (!card.equals("4111111111111111")) {
            return ResponseEntity.status(402).body(Map.of("error",
                    "Payment declined. Use the test card 4111 1111 1111 1111"));
        }
        if (!expiry.matches("\\d{2}/\\d{2}") || !cvv.matches("\\d{3}")) {
            return ResponseEntity.status(402).body(Map.of("error",
                    "Enter expiry as MM/YY and a 3-digit CVV"));
        }

        Plan plan = planOpt.get();

        Optional<Subscription> old = subscriptionRepository
                .findFirstByUserIdAndStatusOrderByStartedAtDesc(userId, "ACTIVE");
        if (old.isPresent()) {
            Subscription o = old.get();
            o.setStatus("CANCELLED");
            subscriptionRepository.save(o);
        }

        Subscription sub = new Subscription();
        sub.setUserId(userId);
        sub.setPlanId(plan.getId());
        sub.setStatus("ACTIVE");
        sub.setStartedAt(LocalDateTime.now());
        sub.setEndsAt(LocalDateTime.now().plusMonths(1));
        subscriptionRepository.save(sub);

        return ResponseEntity.ok(Map.of("paid", true, "plan", planName,
                "message", "Payment successful (demo). You are now on the " + planName + " plan."));
    }
}
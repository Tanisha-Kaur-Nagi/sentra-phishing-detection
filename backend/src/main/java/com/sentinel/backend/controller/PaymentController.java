package com.sentinel.backend.controller;

import com.sentinel.backend.model.Plan;
import com.sentinel.backend.model.Subscription;
import com.sentinel.backend.model.User;
import com.sentinel.backend.repository.PlanRepository;
import com.sentinel.backend.repository.SubscriptionRepository;
import com.sentinel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {

    @Value("${cashfree.client-id}")
    private String clientId;

    @Value("${cashfree.client-secret}")
    private String clientSecret;

    @Value("${cashfree.base-url:https://sandbox.cashfree.com/pg}")
    private String baseUrl;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    private final RestTemplate rest = new RestTemplate();

    private HttpHeaders cashfreeHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("x-client-id", clientId);
        h.set("x-client-secret", clientSecret);
        h.set("x-api-version", "2023-08-01");
        return h;
    }

    // POST /api/payments/create-order  body: {"userId": 1, "planName": "Solo"}
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        String planName = String.valueOf(body.get("planName"));

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        Optional<Plan> planOpt = planRepository.findByName(planName);
        if (planOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Plan not found"));
        }
        Plan plan = planOpt.get();
        if (plan.getPricePerMonth() <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "The Free plan needs no payment"));
        }

        String orderId = "sentra_" + userId + "_" + planName + "_" + System.currentTimeMillis();

        Map<String, Object> customer = new HashMap<>();
        customer.put("customer_id", "user" + userId);
        customer.put("customer_email", userOpt.get().getEmail());
        customer.put("customer_phone", "9999999999");   // demo value, we do not collect phone numbers

        Map<String, Object> meta = new HashMap<>();
        meta.put("return_url", frontendUrl + "/app/pricing?order_id={order_id}");

        Map<String, Object> payload = new HashMap<>();
        payload.put("order_id", orderId);
        payload.put("order_amount", plan.getPricePerMonth().doubleValue());
        payload.put("order_currency", "INR");
        payload.put("customer_details", customer);
        payload.put("order_meta", meta);

        try {
            ResponseEntity<Map> res = rest.postForEntity(
                    baseUrl + "/orders", new HttpEntity<>(payload, cashfreeHeaders()), Map.class);
            Map<?, ?> data = res.getBody();

            // The id from Cashfree can end with extra "payment" text.
            // We remove only ONE "payment" from the very end.
            String sessionId = String.valueOf(data.get("payment_session_id"))
                    .replaceAll("payment$", "");

            Map<String, Object> result = new HashMap<>();
            result.put("orderId", orderId);
            result.put("paymentSessionId", sessionId);
            return ResponseEntity.ok(result);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(502).body(Map.of("error",
                    "Cashfree error: " + e.getResponseBodyAsString()));
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error",
                    "Could not reach Cashfree: " + e.getMessage()));
        }
    }

    // POST /api/payments/verify  body: {"orderId": "sentra_1_Solo_1729..."}
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, Object> body) {
        String orderId = String.valueOf(body.get("orderId"));
        String[] parts = orderId.split("_");
        if (parts.length != 4 || !parts[0].equals("sentra")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid order id"));
        }

        Long userId;
        long orderTime;
        try {
            userId = Long.valueOf(parts[1]);
            orderTime = Long.parseLong(parts[3]);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid order id"));
        }
        String planName = parts[2];

        if (userRepository.findById(userId).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        Optional<Plan> planOpt = planRepository.findByName(planName);
        if (planOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Plan not found"));
        }
        Plan plan = planOpt.get();

        // Ask Cashfree whether this order was really paid
        Map<?, ?> order;
        try {
            ResponseEntity<Map> res = rest.exchange(
                    baseUrl + "/orders/" + orderId, HttpMethod.GET,
                    new HttpEntity<>(cashfreeHeaders()), Map.class);
            order = res.getBody();
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(502).body(Map.of("error",
                    "Cashfree error: " + e.getResponseBodyAsString()));
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error",
                    "Could not reach Cashfree: " + e.getMessage()));
        }

        String status = String.valueOf(order.get("order_status"));
        if (!"PAID".equals(status)) {
            return ResponseEntity.ok(Map.of("paid", false, "status", status));
        }

        // The amount paid must match the plan price
        Number amount = (Number) order.get("order_amount");
        if (amount == null || amount.intValue() != plan.getPricePerMonth()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Amount does not match the plan"));
        }

        // Activate the plan (skip if this order was already used)
        Optional<Subscription> old = subscriptionRepository
                .findFirstByUserIdAndStatusOrderByStartedAtDesc(userId, "ACTIVE");
        if (old.isPresent()) {
            Subscription o = old.get();
            long startedMillis = o.getStartedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
            if (startedMillis >= orderTime) {
                return ResponseEntity.ok(Map.of("paid", true, "plan", planName,
                        "message", "Plan already active"));
            }
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
                "message", "Payment successful. You are now on the " + planName + " plan."));
    }
}
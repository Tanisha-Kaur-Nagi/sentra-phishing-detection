package com.sentinel.backend.controller;

import com.sentinel.backend.model.Plan;
import com.sentinel.backend.model.Role;
import com.sentinel.backend.model.Scan;
import com.sentinel.backend.repository.PlanRepository;
import com.sentinel.backend.repository.ScanRepository;
import com.sentinel.backend.repository.SubscriptionRepository;
import com.sentinel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    @Autowired
    private ScanRepository scanRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    // GET /api/admin/stats — powers the Admin dashboard's top numbers
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        List<Scan> allScans = scanRepository.findAll();

        long totalUsers = userRepository.count();
        long totalScans = allScans.size();
        long threatsBlocked = allScans.stream()
                .filter(s -> s.getVerdict() == Scan.Verdict.MALICIOUS)
                .count();
        double avgConfidence = allScans.stream()
                .mapToDouble(Scan::getConfidence)
                .average()
                .orElse(0.0);

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalScans", totalScans,
                "threatsBlocked", threatsBlocked,
                "avgConfidence", Math.round(avgConfidence * 10.0) / 10.0
        ));
    }

    // GET /api/admin/revenue — subscribers per plan and monthly revenue
    @GetMapping("/revenue")
    public ResponseEntity<?> getRevenue() {
        List<Plan> plans = new ArrayList<>(planRepository.findAll());
        plans.sort(Comparator.comparing(Plan::getPricePerMonth));

        long normalUsers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.USER)
                .count();

        // Step 1: count subscribers of the paid plans
        Map<Long, Long> paidCounts = new HashMap<>();
        long paidTotal = 0;
        for (Plan p : plans) {
            if (p.getPricePerMonth() > 0) {
                long c = subscriptionRepository.countActiveByPlan(p.getId());
                paidCounts.put(p.getId(), c);
                paidTotal += c;
            }
        }

        // Step 2: build one row per plan (Free = users without a paid plan)
        long mrr = 0;
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Plan p : plans) {
            long subs;
            if (p.getPricePerMonth() > 0) {
                subs = paidCounts.get(p.getId());
            } else {
                subs = Math.max(0, normalUsers - paidTotal);
            }
            long revenue = subs * p.getPricePerMonth();
            mrr += revenue;

            Map<String, Object> row = new HashMap<>();
            row.put("name", p.getName());
            row.put("price", p.getPricePerMonth());
            row.put("subscribers", subs);
            row.put("revenue", revenue);
            rows.add(row);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("plans", rows);
        result.put("mrr", mrr);
        result.put("paidSubscribers", paidTotal);
        return ResponseEntity.ok(result);
    }
}
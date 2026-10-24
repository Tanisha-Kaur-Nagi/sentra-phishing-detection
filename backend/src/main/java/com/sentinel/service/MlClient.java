package com.sentinel.backend.service;

import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class MlClient {

    private static final String ML_URL = "http://localhost:5000/predict";
    private final RestTemplate rest;

    public MlClient() {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(2000);
        f.setReadTimeout(4000);
        this.rest = new RestTemplate(f);
    }

    public record MlResult(String verdict, double confidence, String reasons) {}

    @SuppressWarnings("unchecked")
    public Optional<MlResult> predict(String url) {
        try {
            Map<String, Object> res = rest.postForObject(ML_URL, Map.of("url", url), Map.class);
            if (res == null || res.get("verdict") == null) return Optional.empty();

            String verdict = res.get("verdict").toString().toUpperCase();
            double conf = ((Number) res.get("confidence")).doubleValue();
            if (conf <= 1.0) conf = conf * 100.0; // ML may return 0-1; DB uses 0-100
            conf = Math.round(conf * 100.0) / 100.0;

            String reasons = "";
            Object r = res.get("reasons");
            if (r instanceof List<?> list) {
                reasons = String.join(" | ", list.stream().map(String::valueOf).toList());
            }
            return Optional.of(new MlResult(verdict, conf, reasons));
        } catch (Exception e) {
            System.out.println("ML service unavailable, using fallback: " + e.getMessage());
            return Optional.empty();
        }
    }
}
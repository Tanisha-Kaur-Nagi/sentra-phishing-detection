package com.sentinel.backend.dto;

public class ScanRequest {
    private String type;   // "URL" or "FILE"
    private String target; // the actual URL or filename
    private Long userId;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
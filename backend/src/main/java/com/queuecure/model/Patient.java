package com.queuecure.model;

import java.time.Instant;

public class Patient {
    private Long id;
    private int token;
    private String name;
    private String status;
    private Instant createdAt;
    private Instant startedAt;
    private Instant completedAt;

    public Patient(Long id, int token, String name, String status, Instant createdAt) {
        this.id = id;
        this.token = token;
        this.name = name;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public int getToken() { return token; }
    public String getName() { return name; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getCompletedAt() { return completedAt; }

    public void setStatus(String status) { this.status = status; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}

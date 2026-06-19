package com.queuecure.service;

import com.queuecure.dto.QueueStatus;
import com.queuecure.model.Patient;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class QueueService {
    private final List<Patient> patients = new ArrayList<>();
    private final AtomicLong idCounter = new AtomicLong(1);
    private final AtomicInteger tokenCounter = new AtomicInteger(1);
    private int avgConsultationTime = 10;

    public synchronized QueueStatus addPatient(String name) {
        Patient patient = new Patient(
                idCounter.getAndIncrement(),
                tokenCounter.getAndIncrement(),
                name.trim(),
                "WAITING",
                Instant.now()
        );
        patients.add(patient);
        return getStatus();
    }

    public synchronized QueueStatus callNext() {
        Instant now = Instant.now();
        for (Patient patient : patients) {
            if ("IN_PROGRESS".equals(patient.getStatus())) {
                patient.setStatus("COMPLETED");
                patient.setCompletedAt(now);
            }
        }
        for (Patient patient : patients) {
            if ("WAITING".equals(patient.getStatus())) {
                patient.setStatus("IN_PROGRESS");
                patient.setStartedAt(now);
                break;
            }
        }
        return getStatus();
    }

    public synchronized QueueStatus updateAverageTime(int minutes) {
        if (minutes < 1) minutes = 1;
        if (minutes > 120) minutes = 120;
        avgConsultationTime = minutes;
        return getStatus();
    }

    public synchronized QueueStatus reset() {
        patients.clear();
        idCounter.set(1);
        tokenCounter.set(1);
        avgConsultationTime = 10;
        return getStatus();
    }

    public synchronized QueueStatus getStatus() {
        Patient current = patients.stream()
                .filter(p -> "IN_PROGRESS".equals(p.getStatus()))
                .findFirst()
                .orElse(null);

        int waitingCount = (int) patients.stream().filter(p -> "WAITING".equals(p.getStatus())).count();
        int completedCount = (int) patients.stream().filter(p -> "COMPLETED".equals(p.getStatus())).count();

        int actualAverage = calculateActualAverage();

        return new QueueStatus(
                current == null ? null : current.getToken(),
                current == null ? null : current.getName(),
                avgConsultationTime,
                waitingCount,
                completedCount,
                actualAverage,
                new ArrayList<>(patients)
        );
    }

    private int calculateActualAverage() {
        List<Long> minutes = patients.stream()
                .filter(p -> p.getStartedAt() != null && p.getCompletedAt() != null)
                .map(p -> Math.max(1L, Duration.between(p.getStartedAt(), p.getCompletedAt()).toMinutes()))
                .toList();
        if (minutes.isEmpty()) return avgConsultationTime;
        long total = minutes.stream().mapToLong(Long::longValue).sum();
        return Math.max(1, Math.round((float) total / minutes.size()));
    }
}

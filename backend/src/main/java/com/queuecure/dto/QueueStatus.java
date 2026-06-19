package com.queuecure.dto;

import com.queuecure.model.Patient;
import java.util.List;

public record QueueStatus(
        Integer currentToken,
        String currentPatientName,
        int avgConsultationTime,
        int waitingCount,
        int completedCount,
        int actualAverageMinutes,
        List<Patient> patients
) {}

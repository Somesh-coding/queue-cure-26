package com.queuecure.controller;

import com.queuecure.dto.AddPatientRequest;
import com.queuecure.dto.QueueEvent;
import com.queuecure.dto.QueueStatus;
import com.queuecure.service.QueueService;
import jakarta.validation.Valid;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/queue")
public class QueueController {
    private final QueueService queueService;
    private final SimpMessagingTemplate messagingTemplate;

    public QueueController(QueueService queueService, SimpMessagingTemplate messagingTemplate) {
        this.queueService = queueService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/status")
    public QueueStatus status() {
        return queueService.getStatus();
    }

    @PostMapping("/add")
    public QueueStatus addPatient(@Valid @RequestBody AddPatientRequest request) {
        QueueStatus status = queueService.addPatient(request.name());
        publish("PATIENT_ADDED", status);
        return status;
    }

    @PostMapping("/call-next")
    public QueueStatus callNext() {
        QueueStatus status = queueService.callNext();
        publish("TOKEN_CALLED", status);
        return status;
    }

    @PostMapping("/avg-time")
    public QueueStatus updateAverage(@RequestParam int minutes) {
        QueueStatus status = queueService.updateAverageTime(minutes);
        publish("AVG_TIME_UPDATED", status);
        return status;
    }

    @PostMapping("/reset")
    public QueueStatus reset() {
        QueueStatus status = queueService.reset();
        publish("QUEUE_RESET", status);
        return status;
    }

    private void publish(String type, QueueStatus status) {
        messagingTemplate.convertAndSend("/topic/queue", new QueueEvent(type, status));
    }
}

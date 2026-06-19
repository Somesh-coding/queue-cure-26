package com.queuecure.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddPatientRequest(
        @NotBlank(message = "Patient name is required")
        @Size(min = 2, max = 60, message = "Name must be between 2 and 60 characters")
        String name
) {}

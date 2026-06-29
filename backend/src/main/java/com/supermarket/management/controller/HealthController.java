package com.supermarket.management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<?> getHealth() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "database", "Connected",
            "server", "Running"
        ));
    }
}

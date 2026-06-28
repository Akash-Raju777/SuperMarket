package com.supermarket.management.controller;

import com.supermarket.management.dto.CheckoutRequest;
import com.supermarket.management.dto.CheckoutResponse;
import com.supermarket.management.service.POSService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pos")
public class POSController {

    private final POSService posService;

    public POSController(POSService posService) {
        this.posService = posService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody CheckoutRequest request) {
        try {
            CheckoutResponse response = posService.processCheckout(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/customer/{mobile}")
    public ResponseEntity<?> getCustomer(@PathVariable String mobile) {
        try {
            return ResponseEntity.ok(posService.getCustomer(mobile));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    @GetMapping("/bills")
    public ResponseEntity<?> getAllBills() {
        try {
            return ResponseEntity.ok(posService.getAllBills());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }
}

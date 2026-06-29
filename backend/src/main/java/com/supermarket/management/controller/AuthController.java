package com.supermarket.management.controller;

import com.supermarket.management.model.UserAccount;
import com.supermarket.management.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserAccount userAccount) {
        if (userAccount.getUsername() == null || userAccount.getUsername().trim().isEmpty() ||
            userAccount.getPassword() == null || userAccount.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required."));
        }

        String username = userAccount.getUsername().toLowerCase().trim();
        if (username.equals("admin") || username.equals("cashier")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is already taken."));
        }

        Optional<UserAccount> existing = userRepository.findByUsername(username);
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is already taken."));
        }

        userAccount.setUsername(username);
        userAccount.setRole("admin"); // Registering businesses defaults to admin role
        UserAccount saved = userRepository.save(userAccount);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        System.out.println("AuthController: Login attempt for username: " + username);

        if (username == null || username.trim().isEmpty() ||
            password == null || password.trim().isEmpty()) {
            System.out.println("AuthController: Rejecting empty username or password");
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required."));
        }

        username = username.toLowerCase().trim();

        // Check defaults first
        if (username.equals("admin") && password.equals("password123")) {
            System.out.println("AuthController: Successful login for default admin");
            return ResponseEntity.ok(new UserAccount("admin", "password123", "Demo Business", "admin"));
        }
        if (username.equals("cashier") && password.equals("password123")) {
            System.out.println("AuthController: Successful login for default cashier");
            return ResponseEntity.ok(new UserAccount("cashier", "password123", "Demo Business", "cashier"));
        }

        Optional<UserAccount> account = userRepository.findByUsername(username);
        if (account.isPresent()) {
            System.out.println("AuthController: Found user account for: " + username + " in database");
            if (account.get().getPassword().equals(password)) {
                System.out.println("AuthController: Password match successful for user: " + username);
                return ResponseEntity.ok(account.get());
            } else {
                System.out.println("AuthController: Password MISMATCH for user: " + username + " (Expected: " + account.get().getPassword() + ", Received: " + password + ")");
            }
        } else {
            System.out.println("AuthController: User " + username + " NOT found in database");
        }

        return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password."));
    }
}

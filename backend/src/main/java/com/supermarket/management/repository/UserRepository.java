package com.supermarket.management.repository;

import com.supermarket.management.model.UserAccount;
import java.util.Optional;

public interface UserRepository {
    Optional<UserAccount> findByUsername(String username);
    UserAccount save(UserAccount userAccount);
}

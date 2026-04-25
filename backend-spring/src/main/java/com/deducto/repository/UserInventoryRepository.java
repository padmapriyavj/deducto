package com.deducto.repository;

import com.deducto.entity.UserInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserInventoryRepository extends JpaRepository<UserInventory, Long> {

    List<UserInventory> findByUserIdOrderByIdAsc(long userId);

    @Query("SELECT u FROM UserInventory u JOIN FETCH u.shopItem WHERE u.userId = :userId AND u.placement IS NOT NULL ORDER BY u.id ASC")
    List<UserInventory> findByUserIdWithItemWherePlacementNotNull(@Param("userId") long userId);

    Optional<UserInventory> findByIdAndUserId(long id, long userId);
}

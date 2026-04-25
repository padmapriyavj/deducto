package com.deducto.repository;

import com.deducto.entity.ShopItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopItemRepository extends JpaRepository<ShopItem, Long> {
}

package com.deducto.service;

import com.deducto.dto.shop.ShopItemResponse;
import com.deducto.dto.shop.SpacePlacementUpdateItem;
import com.deducto.dto.shop.UserInventoryItemResponse;
import com.deducto.entity.ShopItem;
import com.deducto.entity.User;
import com.deducto.entity.UserInventory;
import com.deducto.repository.ShopItemRepository;
import com.deducto.repository.UserInventoryRepository;
import com.deducto.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ShopService {

    private final ShopItemRepository shopItemRepository;
    private final UserRepository userRepository;
    private final UserInventoryRepository userInventoryRepository;

    public ShopService(
            ShopItemRepository shopItemRepository,
            UserRepository userRepository,
            UserInventoryRepository userInventoryRepository
    ) {
        this.shopItemRepository = shopItemRepository;
        this.userRepository = userRepository;
        this.userInventoryRepository = userInventoryRepository;
    }

    @Transactional(readOnly = true)
    public List<ShopItemResponse> listItems() {
        return shopItemRepository.findAll().stream()
                .map(ShopService::toShopItemResponse)
                .toList();
    }

    @Transactional
    public UserInventoryItemResponse purchase(long userId, long itemId) {
        ShopItem item = shopItemRepository.findById(itemId)
                .orElseThrow(() -> new NoSuchElementException("Item not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        int price = item.getPriceCoins();
        if (user.getCoins() < price) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient coins");
        }
        user.setCoins(user.getCoins() - price);
        var inv = new UserInventory();
        inv.setUserId(userId);
        inv.setShopItem(item);
        inv.setAcquiredAt(OffsetDateTime.now());
        inv.setPlacement(null);
        userRepository.save(user);
        userInventoryRepository.save(inv);
        return toInventoryItem(inv, item);
    }

    @Transactional(readOnly = true)
    public List<UserInventoryItemResponse> myInventory(long userId) {
        return userInventoryRepository.findByUserIdOrderByIdAsc(userId).stream()
                .map(this::toInventoryItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserInventoryItemResponse> mySpace(long userId) {
        return userInventoryRepository.findByUserIdWithItemWherePlacementNotNull(userId).stream()
                .map(this::toInventoryItem)
                .toList();
    }

    @Transactional
    public List<UserInventoryItemResponse> updateSpace(long userId, List<SpacePlacementUpdateItem> updates) {
        for (var u : updates) {
            var inv = userInventoryRepository.findByIdAndUserId(u.inventoryId(), userId)
                    .orElseThrow(() -> new NoSuchElementException("Inventory not found"));
            inv.setPlacement(u.placement());
            userInventoryRepository.save(inv);
        }
        return mySpace(userId);
    }

    private UserInventoryItemResponse toInventoryItem(UserInventory inv) {
        return toInventoryItem(inv, inv.getShopItem());
    }

    private UserInventoryItemResponse toInventoryItem(UserInventory inv, ShopItem item) {
        String at = inv.getAcquiredAt() != null ? inv.getAcquiredAt().toString() : null;
        return new UserInventoryItemResponse(
                inv.getId(),
                inv.getUserId(),
                item.getId(),
                at,
                inv.getPlacement(),
                toShopItemResponse(item)
        );
    }

    private static ShopItemResponse toShopItemResponse(ShopItem item) {
        return new ShopItemResponse(
                item.getId(),
                item.getName(),
                item.getCategory(),
                item.getAssetUrl(),
                item.getPriceCoins(),
                item.getRarity()
        );
    }
}

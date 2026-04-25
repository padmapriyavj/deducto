package com.deducto.controller;

import com.deducto.dto.shop.ShopItemResponse;
import com.deducto.dto.shop.ShopPurchaseRequest;
import com.deducto.dto.shop.UserInventoryItemResponse;
import com.deducto.security.UserPrincipal;
import com.deducto.service.ShopService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shop")
public class ShopController {

    private final ShopService shopService;

    public ShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    @GetMapping("/items")
    public List<ShopItemResponse> listItems() {
        return shopService.listItems();
    }

    @PostMapping("/purchase")
    public UserInventoryItemResponse purchase(
            @Valid @RequestBody ShopPurchaseRequest body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        return shopService.purchase(principal.id(), body.itemId());
    }

    private static void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
    }
}

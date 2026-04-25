package com.deducto.controller;

import com.deducto.dto.shop.SpacePlacementUpdateItem;
import com.deducto.dto.shop.UserInventoryItemResponse;
import com.deducto.security.UserPrincipal;
import com.deducto.service.ShopService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    private final ShopService shopService;

    public MeController(ShopService shopService) {
        this.shopService = shopService;
    }

    @GetMapping("/inventory")
    public List<UserInventoryItemResponse> inventory(@AuthenticationPrincipal UserPrincipal principal) {
        requireAuth(principal);
        return shopService.myInventory(principal.id());
    }

    @GetMapping("/space")
    public List<UserInventoryItemResponse> getSpace(@AuthenticationPrincipal UserPrincipal principal) {
        requireAuth(principal);
        return shopService.mySpace(principal.id());
    }

    @PutMapping("/space")
    public List<UserInventoryItemResponse> putSpace(
            @Valid @RequestBody List<SpacePlacementUpdateItem> body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request body");
        }
        return shopService.updateSpace(principal.id(), body);
    }

    private static void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
    }
}

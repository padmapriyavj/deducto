package com.deducto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

/**
 * {@code user_inventory}; Spring updates {@code placement} in space API and rows on purchase.
 */
@Entity
@Table(name = "user_inventory")
public class UserInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "shop_item_id", nullable = false)
    private ShopItem shopItem;

    @Column(name = "acquired_at", nullable = false)
    private OffsetDateTime acquiredAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "placement", columnDefinition = "jsonb")
    private String placement;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public ShopItem getShopItem() {
        return shopItem;
    }

    public void setShopItem(ShopItem shopItem) {
        this.shopItem = shopItem;
    }

    public OffsetDateTime getAcquiredAt() {
        return acquiredAt;
    }

    public void setAcquiredAt(OffsetDateTime acquiredAt) {
        this.acquiredAt = acquiredAt;
    }

    public String getPlacement() {
        return placement;
    }

    public void setPlacement(String placement) {
        this.placement = placement;
    }
}

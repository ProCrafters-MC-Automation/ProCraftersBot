"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxDamageOffset = exports.Cooldown = exports.attackSpeeds = void 0;
exports.attackSpeeds = {
    wooden_sword: 1.7,
    golden_sword: 1.7,
    stone_sword: 1.7,
    iron_sword: 1.7,
    diamond_sword: 1.7,
    netherite_sword: 1.7,
    trident: 1.1,
    wooden_shovel: 1.1,
    golden_shovel: 1.1,
    stone_shovel: 1.1,
    iron_shovel: 1.1,
    diamond_shovel: 1.1,
    netherite_shovel: 1.1,
    wooden_pickaxe: 1.2,
    golden_pickaxe: 1.2,
    stone_pickaxe: 1.2,
    iron_pickaxe: 1.2,
    diamond_pickaxe: 1.2,
    netherite_pickaxe: 1.2,
    wooden_axe: 0.8,
    golden_axe: 1.1,
    stone_axe: 0.8,
    iron_axe: 0.9,
    diamond_axe: 1.0,
    netherite_axe: 1.1,
    wooden_hoe: 1.1,
    golden_hoe: 1.1,
    stone_hoe: 2.0,
    iron_hoe: 3.0,
    diamond_hoe: 4.0,
    netherite_hoe: 4.0,
    other: 4.0,
};
class Cooldown {
    constructor(weaponName, x, min, max) {
        this.weaponName = weaponName;
        this.x = x;
        this.min = min;
        this.max = max;
    }
    getAttackSpeed(weaponName) {
        if (!weaponName)
            return exports.attackSpeeds.other;
        // @ts-expect-error
        return exports.attackSpeeds[weaponName] || exports.attackSpeeds.other;
    }
    clamp(x, min, max) {
        if (x < min)
            return min;
        if (x > max)
            return max;
        return x;
    }
    getCooldown(weaponName) {
        const speed = this.getAttackSpeed(weaponName);
        return Math.floor((1 / speed) * 20);
    }
    getDamageMultiplier(weaponName) {
        const speed = this.getAttackSpeed(weaponName);
        const damageMul = 0.2 + Math.pow((speed + 0.5) / ((1 / speed) * 20), 2) * 0.8;
        return this.clamp(damageMul, 0.2, 1.0);
    }
}
exports.Cooldown = Cooldown;
class MaxDamageOffset {
    constructor(bot, min = 0, max = 0) {
        this.bot = bot;
        this.min = min;
        this.max = max;
    }
    getTicks(item) {
        const heldItem = item;
        const cooldown = Cooldown.prototype.getCooldown(!!heldItem ? heldItem.name : "other");
        const ticks = Math.floor(Math.random() * (this.max - this.min) + this.min) + cooldown;
        return Math.max(1, ticks);
    }
}
exports.MaxDamageOffset = MaxDamageOffset;

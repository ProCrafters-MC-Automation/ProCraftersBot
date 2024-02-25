/// <reference types="node" />
import { Bot } from "mineflayer";
import { Entity } from "prismarine-entity";
import { Item } from "prismarine-item";
import { MaxDamageOffset } from "./sworddata";
import { SwordFullConfig } from "./swordconfigs";
import { EventEmitter } from "stream";
/**
 * The main pvp manager plugin class.
 */
export declare class SwordPvp extends EventEmitter {
    bot: Bot;
    options: SwordFullConfig;
    timeToNextAttack: number;
    ticksSinceTargetAttack: number;
    ticksSinceLastHurt: number;
    ticksSinceLastTargetHit: number;
    ticksSinceLastSwitch: number;
    wasInRange: boolean;
    meleeAttackRate: MaxDamageOffset;
    target?: Entity;
    lastTarget?: Entity;
    weaponOfChoice: string;
    private firstHit;
    private tickOverride;
    private targetShielding;
    private currentStrafeDir?;
    private strafeCounter;
    private targetGoal?;
    constructor(bot: Bot, options?: SwordFullConfig);
    changeWeaponState(weapon: string): Item | null;
    checkForWeapon(weapon?: string): Item | null;
    equipWeapon(weapon: Item): Promise<boolean>;
    getWeaponOfEntity(entity?: Entity): Item;
    getShieldStatusOfEntity(entity?: Entity): boolean;
    checkForShield: () => Promise<void>;
    swingUpdate: (entity: Entity) => Promise<void>;
    hurtUpdate: (entity: Entity) => Promise<void>;
    attack(target: Entity): Promise<void>;
    stop(): void;
    update: () => void;
    botReach(): number;
    targetReach(): number;
    checkRange(): void;
    logHealth(health: number): Promise<void>;
    causeCritical(): Promise<boolean>;
    private forwardOrBack;
    doMove(): Promise<void>;
    doStrafe(): Promise<false | undefined>;
    sprintTap(): Promise<false | undefined>;
    toggleShield(): Promise<false | undefined>;
    rotate(): false | undefined;
    reactionaryCrit(): Promise<void>;
    attemptAttack(): Promise<void>;
    hasShield(): boolean;
}

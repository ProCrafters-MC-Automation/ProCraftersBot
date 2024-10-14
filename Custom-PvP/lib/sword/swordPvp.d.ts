/// <reference types="node" />
import { Bot } from "mineflayer";
import { Entity } from "prismarine-entity";
import { Item } from "prismarine-item";
import { EventEmitter } from "stream";
import { FullConfig } from "./swordconfigs";
import { MaxDamageOffset } from "./sworddata";
/**
 * The main pvp manager plugin class.
 */
export declare class SwordPvp extends EventEmitter {
    bot: Bot;
    options: FullConfig;
    ticksToNextAttack: number;
    ticksSinceTargetAttack: number;
    ticksSinceLastHurt: number;
    ticksSinceLastTargetHit: number;
    ticksSinceLastSwitch: number;
    wasInRange: boolean;
    meleeAttackRate: MaxDamageOffset;
    target?: Entity;
    lastTarget?: Entity;
    weaponOfChoice: string;
    private willBeFirstHit;
    private tickOverride;
    private targetShielding;
    private currentStrafeDir?;
    private strafeCounter;
    private targetGoal?;
    constructor(bot: Bot, options?: FullConfig);
    changeWeaponState(weapon: string): Item | null;
    checkForWeapon(weapon?: string): Item | null;
    equipWeapon(weapon: Item): Promise<boolean>;
    entityWeapon(entity?: Entity): Item;
    entityShieldStatus(entity?: Entity): boolean;
    checkForShield: () => Promise<void>;
    swingUpdate: (entity: Entity) => Promise<void>;
    private lastHealth;
    hurtUpdate: (entity: Entity) => Promise<void>;
    attack(target: Entity): Promise<void>;
    stop(): void;
    update: () => void;
    botReach(): number;
    targetReach(): number;
    checkRange(): void;
    causeCritical(): Promise<boolean>;
    doMove(): Promise<void>;
    doStrafe(): Promise<false | undefined>;
    sprintTap(): Promise<false | undefined>;
    toggleShield(): Promise<false | undefined>;
    rotate(): false | undefined;
    reactionaryCrit(noTickLimit?: boolean): Promise<void>;
    attemptAttack(reason: string): Promise<void>;
    shieldEquipped(): boolean;
}

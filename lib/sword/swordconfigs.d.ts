import { Bot } from "mineflayer";
import type { goals } from "mineflayer-pathfinder";
import { Entity } from "prismarine-entity";
export interface FullConfig {
    genericConfig: GenericConfig;
    tapConfig: TapConfig;
    onHitConfig: OnHitConfig;
    strafeConfig: StrafeConfig;
    swingConfig: SwingBehaviorConfig;
    critConfig: CriticalsConfig;
    shieldConfig: ShieldConfig;
    shieldDisableConfig: ShieldDisableConfig;
    rotateConfig: RotateConfig;
    followConfig: FollowConfig;
    cps?: number;
}
export type ShieldDisableConfig = {
    enabled: boolean;
    mode: "single" | "double";
};
export type GenericConfig = {
    viewDistance: number;
    attackRange: number;
    tooCloseRange: number;
    missChancePerTick: number;
    enemyReach: number;
    hitThroughWalls: boolean;
};
export type SwingBehaviorConfig = {
    mode: "killaura" | "fullswing";
};
export type StrafeModeConfig = {
    mode: "circle" | "random" | "intelligent";
    maxOffset?: number;
};
export type StrafeConfig = {
    enabled: boolean;
    mode: StrafeModeConfig;
};
export type TapConfig = {
    enabled: boolean;
    mode: "wtap" | "stap" | "sprintcancel";
    delay: number;
};
export type KBConfig = {
    enabled: boolean;
    mode: "jump";
} | {
    enabled: boolean;
    mode: "velocity";
    hRatio?: number;
    yRatio: number;
} | {
    enabled: boolean;
    mode: "shift" | "jumpshift";
    delay?: number;
};
export type OnHitConfig = {
    enabled: boolean;
    mode: "backoff";
    kbCancel: KBConfig;
    tickCount?: number;
};
export type ReactionCritConfig = {
    enabled: false;
} | {
    enabled: true;
    maxWaitTicks?: number;
    maxWaitDistance?: number;
    maxPreemptiveTicks?: number;
};
export type CriticalsConfig = {
    enabled: boolean;
    reaction: ReactionCritConfig;
} & ({
    mode: "hop" | "shorthop";
    attemptRange?: number;
} | {
    enabled: boolean;
    mode: "packet";
    bypass?: boolean;
});
export type ShieldConfig = {
    enabled: boolean;
    mode: "legit" | "blatant";
};
export type RotateConfig = {
    enabled: boolean;
    smooth: boolean;
    lookAtHidden: boolean;
    mode: "legit" | "instant" | "constant" | "silent" | "ignore";
};
export type FollowConfig = {} & ({
    mode: "standard";
    predictTicks?: number;
    distance: number;
} | {
    mode: "jump";
    distance: number;
} | {
    mode: "custom";
    goal: (bot: Bot, entity: Entity, options: FullConfig) => goals.Goal;
});
export declare const defaultConfig: FullConfig;
export declare function getConfig(bot: Bot): FullConfig;

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
}
export declare const defaultConfig: FullConfig;
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
    mode: "legit" | "instant" | "constant" | "silent" | "ignore";
};
export type FollowConfig = {
    mode: "jump" | "standard";
    distance: number;
} & ({
    predict: false;
} | {
    predict: true;
    predictTicks?: number;
});

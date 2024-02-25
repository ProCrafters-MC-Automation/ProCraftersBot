export interface SwordFullConfig {
    genericConfig: GenericConfig;
    tapConfig: TapConfig;
    kbCancelConfig: KBConfig;
    strafeConfig: StrafeConfig;
    swingConfig: SwingBehaviorConfig;
    critConfig: CriticalsConfig;
    shieldConfig: ShieldConfig;
    shieldDisableConfig: ShieldDisableConfig;
    rotateConfig: RotateConfig;
    followConfig: FollowConfig;
}
export declare const defaultSwordConfig: SwordFullConfig;
export interface ShieldDisableConfig {
    enabled: boolean;
    mode: "single" | "double";
}
export interface GenericConfig {
    viewDistance: number;
    attackRange: number;
    missChancePerTick: number;
    enemyReach: number;
}
export interface SwingBehaviorConfig {
    mode: "killaura" | "fullswing";
}
export interface StrafeModeConfig {
    name: "circle" | "random" | "intelligent";
    maxOffset?: number;
}
export interface StrafeConfig {
    enabled: boolean;
    mode: StrafeModeConfig;
}
export interface TapConfig {
    enabled: boolean;
    mode: "wtap" | "stap" | "sprintcancel";
    delay: number;
}
export interface KBConfig {
    enabled: boolean;
    mode: KBModeConfig;
}
export interface KBModeConfig {
    name: "jump" | "shift" | "jumpshift" | "velocity";
    delay?: number;
    hRatio?: number;
    yRatio?: number;
}
export interface CriticalsConfig {
    enabled: boolean;
    mode: "packet" | "shorthop" | "hop";
}
export interface ShieldConfig {
    enabled: boolean;
    mode: "legit" | "blatant";
}
export interface RotateConfig {
    enabled: boolean;
    mode: "legit" | "instant" | "constant" | "silent" | "ignore";
}
export interface FollowConfig {
    mode: "jump" | "standard";
    distance: number;
}

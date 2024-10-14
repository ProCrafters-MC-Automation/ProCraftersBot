"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.defaultConfig = {
    genericConfig: {
        viewDistance: 128,
        attackRange: 3,
        tooCloseRange: 2,
        missChancePerTick: 0.0,
        enemyReach: 3,
    },
    tapConfig: {
        enabled: true,
        mode: "stap",
        delay: 0,
    },
    strafeConfig: {
        enabled: true,
        mode: {
            mode: "intelligent",
            maxOffset: Math.PI / 2,
        },
    },
    critConfig: {
        enabled: true,
        mode: "hop",
        attemptRange: 2.5,
        reaction: {
            enabled: true,
            maxPreemptiveTicks: 1,
            maxWaitTicks: 5,
            maxWaitDistance: 5,
        },
    },
    onHitConfig: {
        enabled: true,
        mode: "backoff",
        kbCancel: {
            enabled: true,
            mode: "jump",
        },
    },
    rotateConfig: {
        enabled: true,
        mode: "constant",
    },
    shieldConfig: {
        enabled: true,
        mode: "legit",
    },
    shieldDisableConfig: {
        enabled: true,
        mode: "single", // not used rn
    },
    swingConfig: {
        mode: "fullswing",
    },
    followConfig: {
        mode: "standard",
        distance: 3,
        predict: true
    },
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSwordConfig = void 0;
exports.defaultSwordConfig = {
    genericConfig: {
        viewDistance: 128,
        attackRange: 3,
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
            name: "intelligent",
            maxOffset: Math.PI / 2
        }
    },
    critConfig: {
        enabled: true,
        mode: "hop"
    },
    kbCancelConfig: {
        enabled: true,
        // mode: {
        //     name: "velocity",
        //     hRatio: 0,
        //     yRatio: 0,
        // }
        mode: {
            name: "jump",
            delay: 0
        }
    },
    rotateConfig: {
        enabled: true,
        mode: "constant"
    },
    shieldConfig: {
        enabled: true,
        mode: "legit"
    },
    shieldDisableConfig: {
        enabled: true,
        mode: "single" // not used rn
    },
    swingConfig: {
        mode: "fullswing"
    },
    followConfig: {
        mode: "standard",
        distance: 3
    }
};

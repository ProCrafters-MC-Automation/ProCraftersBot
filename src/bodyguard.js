const { Movements, goals } = require('mineflayer-pathfinder');
const { GoalBlock, GoalNear } = goals;

class BodyguardSystem {
    constructor() {
        // Map of bossUsername -> Set of bot instances
        this.bossGuards = new Map();
        this.personalSpace = 4;
    }

    getGuardsForBoss(bossUsername) {
        if (!this.bossGuards.has(bossUsername)) {
            this.bossGuards.set(bossUsername, new Set());
        }
        return Array.from(this.bossGuards.get(bossUsername));
    }

    recalculateFormation(bossUsername) {
        const guards = this.getGuardsForBoss(bossUsername);
        const count = guards.length;
        guards.forEach((bot, idx) => {
            bot.guardIndex = idx;
            bot.guardDirection = count > 0 ? (Math.PI * 2 / count) * idx : 0;
        });
    }

    /**
     * Make existing bots bodyguard a player
     */
    addExistingGuards(bots, bossUsername, options = {}) {
        if (!Array.isArray(bots)) bots = [bots];
        const added = [];

        for (const bot of bots) {
            if (!bot || !bot.username) continue;

            bot.state = 'bodyguard';
            bot.guardBoss = bossUsername;
            bot.guardTarget = null;
            bot.personalSpace = options.personalSpace || this.personalSpace;

            // Register into boss guards
            if (!this.bossGuards.has(bossUsername)) {
                this.bossGuards.set(bossUsername, new Set());
            }
            this.bossGuards.get(bossUsername).add(bot);

            this.setupGuardListeners(bot, bossUsername);

            if (bot.equipForCombat) {
                bot.equipForCombat();
            }

            added.push(bot);
        }

        this.recalculateFormation(bossUsername);
        return added;
    }

    /**
     * Spawn new bots into the server as bodyguards
     */
    async spawnNewGuards(swarmManager, bossUsername, count = 1, prefix = 'Guard', options = {}) {
        const numBots = Math.max(1, parseInt(count, 10) || 1);
        const spawnedBots = [];

        for (let i = 0; i < numBots; i++) {
            const name = `${prefix}#${Date.now() % 10000}_${i + 1}`;
            const bot = await swarmManager.spawnBot(name, 'bodyguard');

            bot.once('spawn', () => {
                this.addExistingGuards(bot, bossUsername, options);
                bot.chat(`I am the bodyguard of ${bossUsername}`);
            });

            spawnedBots.push(bot);
            // Stagger connections slightly
            await new Promise(r => setTimeout(r, 600));
        }

        return spawnedBots;
    }

    setupGuardListeners(bot, bossUsername) {
        if (bot._guardListenersAttached) return;
        bot._guardListenersAttached = true;

        let tickCounter = 0;

        bot.on('physicsTick', () => {
            if (bot.state !== 'bodyguard' || bot.guardBoss !== bossUsername) return;

            tickCounter++;
            if (tickCounter % 3 !== 0) return; // run every ~150ms

            const bossPlayer = bot.players[bossUsername];
            if (!bossPlayer || !bossPlayer.entity) return;

            const bossEntity = bossPlayer.entity;
            const yaw = bossEntity.yaw || 0;
            const dir = bot.guardDirection || 0;
            const dist = bot.personalSpace || this.personalSpace;

            // If we have an active combat target
            if (bot.guardTarget && bot.guardTarget.isValid) {
                bot.lookAt(bot.guardTarget.position);
                if (bot.equipForCombat) bot.equipForCombat();

                const targetDist = bot.entity.position.distanceTo(bot.guardTarget.position);
                if (targetDist > 4.5) {
                    if (bot.moveTo) bot.moveTo(bot.guardTarget.position);
                } else {
                    if (bot.pvp) {
                        bot.pvp.attack(bot.guardTarget);
                    } else {
                        bot.attack(bot.guardTarget);
                    }
                }
                return;
            } else if (bot.guardTarget) {
                // Target is dead or no longer valid
                bot.guardTarget = null;
                if (bot.stopMoving) bot.stopMoving();
            }

            // Normal bodyguard formation: circle around the boss
            const targetX = bossEntity.position.x + Math.sin(dir + yaw) * dist;
            const targetZ = bossEntity.position.z + Math.cos(dir + yaw) * dist;
            const targetY = bossEntity.position.y;
            const guardPos = bossEntity.position.offset(Math.sin(dir + yaw) * dist, 0, Math.cos(dir + yaw) * dist);

            const distanceToGuardSpot = bot.entity.position.xzDistanceTo(guardPos);

            if (distanceToGuardSpot > dist + 1) {
                // Move towards formation spot
                try {
                    const mcData = require('minecraft-data')(bot.version);
                    const movements = new Movements(bot, mcData);
                    movements.allowFreeMotion = true;
                    movements.allowParkour = true;
                    bot.pathfinder.setMovements(movements);
                    bot.pathfinder.setGoal(new GoalNear(targetX, targetY, targetZ, 1), true);
                    bot.lookAt(guardPos);
                } catch (e) {
                    // Fallback to moveTo
                    if (bot.moveTo) bot.moveTo(guardPos);
                }
            } else {
                // In position: face the direction boss is facing or outward
                bot.lookAt(bossEntity.position.offset(Math.sin(dir + yaw) * (dist + 5), 1.6, Math.cos(dir + yaw) * (dist + 5)));
            }
        });

        // Auto-defense: if an entity hurts the boss, attack the attacker!
        bot.on('entityHurt', (entity) => {
            if (bot.state !== 'bodyguard' || bot.guardBoss !== bossUsername) return;
            if (entity.username !== bossUsername) return;

            // Find nearest hostile or attacker
            const attacker = bot.nearestEntity((e) => {
                if (!e || e === bot.entity || e.username === bossUsername) return false;
                // Don't attack other bodyguards
                if (this.isGuard(bossUsername, e.username)) return false;
                return e.position.distanceTo(entity.position) < 16;
            });

            if (attacker) {
                this.setTargetForGuards(bossUsername, attacker);
            }
        });

        // When target disappears or dies
        bot.on('entityGone', (entity) => {
            if (bot.guardTarget === entity) {
                bot.guardTarget = null;
                if (bot.stopMoving) bot.stopMoving();
            }
        });
    }

    isGuard(bossUsername, username) {
        const guards = this.getGuardsForBoss(bossUsername);
        return guards.some(g => g.username === username);
    }

    setTargetForGuards(bossUsername, targetEntity) {
        const guards = this.getGuardsForBoss(bossUsername);
        guards.forEach(guard => {
            guard.guardTarget = targetEntity;
            if (guard.equipForCombat) guard.equipForCombat();
        });
    }

    haltGuards(bossUsername) {
        const guards = this.getGuardsForBoss(bossUsername);
        guards.forEach(guard => {
            guard.guardTarget = null;
            if (guard.stopMoving) guard.stopMoving();
            if (guard.clearTargets) guard.clearTargets();
        });
    }

    stopGuards(bots, bossUsername = null) {
        if (!Array.isArray(bots)) bots = [bots];

        for (const bot of bots) {
            if (!bot) continue;
            const boss = bossUsername || bot.guardBoss;

            if (boss && this.bossGuards.has(boss)) {
                this.bossGuards.get(boss).delete(bot);
                this.recalculateFormation(boss);
            }

            bot.state = 'idle';
            bot.guardBoss = null;
            bot.guardTarget = null;
            if (bot.stopMoving) bot.stopMoving();
            if (bot.clearTargets) bot.clearTargets();
            if (bot.pathfinder) bot.pathfinder.setGoal(null);
        }
    }

    dismissGuards(swarmManager, bossUsername, prefix = null) {
        const guards = this.getGuardsForBoss(bossUsername);
        const toDismiss = guards.filter(g => !prefix || g.username.startsWith(prefix));

        this.stopGuards(toDismiss, bossUsername);

        toDismiss.forEach(bot => {
            swarmManager.removeBot(bot);
        });

        return toDismiss.length;
    }
}

const defaultBodyguardSystem = new BodyguardSystem();

module.exports = {
    BodyguardSystem,
    bodyguardSystem: defaultBodyguardSystem
};

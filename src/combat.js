let attackSpeeds;
try {
    attackSpeeds = require('./data/AttackSpeeds.json');
} catch (e) {
    try {
        attackSpeeds = require('../AttackSpeeds.json');
    } catch {
        attackSpeeds = { other: 1.6 };
    }
}

function getAttackSpeed(weaponName) {
    if (!weaponName) return attackSpeeds.other || 1.6;
    return attackSpeeds[weaponName] || attackSpeeds.other || 1.6;
}

function getCooldown(weaponName) {
    const speed = getAttackSpeed(weaponName);
    return Math.floor((1 / speed) * 20);
}

function load(bot) {
    bot.combatState = {
        targets: [],
        attackTick: 0,
        mvTick: 0,
        isShieldActive: false,
        mode: 'idle', // 'idle' | 'sword' | 'bow' | 'auto'
        target: null,
        currentWeapon: 'none'
    };

    bot.huntTargetName = null;

    bot.addTarget = function (filter) {
        if (!bot.combatState.targets.includes(filter)) {
            bot.combatState.targets.push(filter);
        }
    };

    bot.clearTargets = function () {
        bot.combatState.targets = [];
        bot.combatState.mode = 'idle';
        bot.combatState.target = null;
        bot.combatState.currentWeapon = 'none';
        bot.huntTargetName = null;

        bot.setControlState('forward', false);
        bot.setControlState('sprint', false);
        bot.setControlState('jump', false);

        if (bot.swordpvp && typeof bot.swordpvp.stop === 'function') {
            try { bot.swordpvp.stop(); } catch {}
        }
        if (bot.bowpvp && typeof bot.bowpvp.stop === 'function') {
            try { bot.bowpvp.stop(); } catch {}
        }
        if (bot.pvp && typeof bot.pvp.stop === 'function') {
            try { bot.pvp.stop(); } catch {}
        }
        if (bot.pathfinder) {
            try { bot.pathfinder.setGoal(null); } catch {}
        }
    };

    bot.hasShield = function () {
        if (typeof bot.supportFeature === 'function' && bot.supportFeature('doesntHaveOffHandSlot')) {
            return false;
        }
        if (!bot.inventory || !bot.inventory.slots) return false;
        const offhand = bot.inventory.slots[45];
        return offhand && offhand.name && offhand.name.includes('shield');
    };

    bot.hasBowAndArrows = function () {
        if (!bot.inventory) return false;
        const items = typeof bot.inventory.items === 'function' ? bot.inventory.items() : [];
        const hasBow = items.some(i => i.name && (i.name.includes('bow') || i.name.includes('crossbow')));
        const hasArrows = items.some(i => i.name && i.name.includes('arrow'));
        return hasBow && hasArrows;
    };

    bot.useShield = function (active = true) {
        if (!bot.hasShield()) return;
        if (active && !bot.combatState.isShieldActive) {
            bot.activateItem(true);
            bot.combatState.isShieldActive = true;
        } else if (!active && bot.combatState.isShieldActive) {
            bot.deactivateItem();
            bot.combatState.isShieldActive = false;
        }
    };

    bot.equipSword = async function () {
        if (!bot.inventory || typeof bot.inventory.items !== 'function') return;
        const items = bot.inventory.items();
        const weapon = items.find(i => i.name && (i.name.includes('sword') || i.name.includes('axe')));
        if (weapon && typeof bot.equip === 'function') {
            try { await bot.equip(weapon, 'hand'); } catch {}
        }
        const shield = items.find(i => i.name && i.name.includes('shield'));
        if (shield && bot.getEquipmentDestSlot && typeof bot.equip === 'function') {
            try { await bot.equip(shield, 'off-hand'); } catch {}
        }
        if (bot.armorManager && typeof bot.armorManager.equipAll === 'function') {
            try { bot.armorManager.equipAll(); } catch {}
        }
    };

    bot.equipBow = async function () {
        if (!bot.inventory || typeof bot.inventory.items !== 'function') return;
        const items = bot.inventory.items();
        const bow = items.find(i => i.name && (i.name === 'bow' || i.name === 'crossbow'));
        if (bow && typeof bot.equip === 'function') {
            try { await bot.equip(bow, 'hand'); } catch {}
        }
        if (bot.armorManager && typeof bot.armorManager.equipAll === 'function') {
            try { bot.armorManager.equipAll(); } catch {}
        }
    };

    bot.equipForCombat = bot.equipSword;

    bot.findEntityByName = function (name) {
        if (!name) return null;
        const lower = name.toLowerCase().trim();
        // 1. Check players map (case-insensitive)
        if (bot.players) {
            for (const username in bot.players) {
                if (username.toLowerCase() === lower) {
                    const p = bot.players[username];
                    if (p && p.entity && p.entity.isValid) return p.entity;
                }
            }
        }
        // 2. Check nearest entity matching username or name
        if (typeof bot.nearestEntity === 'function') {
            return bot.nearestEntity(e => {
                if (!e || !e.isValid || e === bot.entity) return false;
                if (e.username && e.username.toLowerCase() === lower) return true;
                if (e.name && e.name.toLowerCase() === lower) return true;
                return false;
            });
        }
        return null;
    };

    bot.startSwordPvP = function (target) {
        if (!target || !target.isValid) return false;
        bot.combatState.target = target;
        bot.combatState.currentWeapon = 'sword';
        if (typeof bot.equipSword === 'function') {
            bot.equipSword().catch(() => {});
        }

        if (bot.bowpvp && typeof bot.bowpvp.stop === 'function') {
            try { bot.bowpvp.stop(); } catch {}
        }

        // If target is beyond immediate reach, engage pathfinder GoalFollow to navigate around obstacles
        if (bot.pathfinder && typeof bot.pathfinder.setGoal === 'function' && bot.entity && bot.entity.position && target.position) {
            const dist = bot.entity.position.distanceTo(target.position);
            if (dist > 2.8) {
                try {
                    const { goals } = require('mineflayer-pathfinder');
                    bot.pathfinder.setGoal(new goals.GoalFollow(target, 2.0), true);
                } catch (e) {}
            }
        }

        if (bot.swordpvp && typeof bot.swordpvp.attack === 'function') {
            bot.swordpvp.attack(target);
            return true;
        } else if (bot.pvp && typeof bot.pvp.attack === 'function') {
            bot.pvp.attack(target);
            return true;
        } else if (typeof bot.attackTarget === 'function') {
            bot.attackTarget(target);
            return true;
        }
        return false;
    };

    bot.startBowPvP = function (target) {
        if (!target || !target.isValid) return false;
        bot.combatState.target = target;
        bot.combatState.currentWeapon = 'bow';
        if (typeof bot.equipBow === 'function') {
            bot.equipBow().catch(() => {});
        }

        if (bot.swordpvp && typeof bot.swordpvp.stop === 'function') {
            try { bot.swordpvp.stop(); } catch {}
        }

        if (bot.bowpvp && typeof bot.bowpvp.attack === 'function') {
            bot.bowpvp.attack(target, 'bow');
            return true;
        } else if (bot.pvp && typeof bot.pvp.attack === 'function') {
            bot.pvp.attack(target);
            return true;
        } else if (typeof bot.attackTarget === 'function') {
            bot.attackTarget(target);
            return true;
        }
        return false;
    };

    bot.startAutoPvP = function (target) {
        if (!target || !target.isValid) return false;
        bot.combatState.target = target;
        const dist = (bot.entity && bot.entity.position && target.position)
            ? bot.entity.position.distanceTo(target.position)
            : 0;

        if (dist > 6.5 && bot.hasBowAndArrows()) {
            return bot.startBowPvP(target);
        } else {
            return bot.startSwordPvP(target);
        }
    };

    bot.attackPlayer = function (targetName, mode = 'auto') {
        if (!targetName) return false;
        bot.huntTargetName = targetName.toLowerCase().trim();
        bot.combatState.mode = mode;

        const entity = bot.findEntityByName(bot.huntTargetName);
        if (entity && entity.isValid) {
            bot.combatState.target = entity;
            if (mode === 'bow' && bot.hasBowAndArrows()) {
                return bot.startBowPvP(entity);
            } else if (mode === 'sword') {
                return bot.startSwordPvP(entity);
            } else {
                return bot.startAutoPvP(entity);
            }
        }
        return false;
    };

    bot.attackTarget = function (target) {
        if (!target || !target.isValid) return;

        const mainHand = bot.heldItem;
        const weaponName = mainHand ? mainHand.name : null;
        const cooldownTicks = getCooldown(weaponName);

        if (bot.combatState.attackTick >= cooldownTicks) {
            bot.lookAt(target.position.offset(0, target.height * 0.85, 0), true);
            bot.attack(target);
            bot.combatState.attackTick = 0;
        }
    };

    bot.checkForTargets = function () {
        bot.combatState.attackTick++;
        bot.combatState.mvTick++;

        // If continuous hunt mode is active, check and track target until killed
        if (bot.huntTargetName) {
            const targetEntity = (bot.combatState.target && bot.combatState.target.isValid)
                ? bot.combatState.target
                : bot.findEntityByName(bot.huntTargetName);

            if (targetEntity && targetEntity.isValid) {
                bot.combatState.target = targetEntity;

                const hasPos = bot.entity && bot.entity.position && targetEntity.position;
                const dist = hasPos ? bot.entity.position.distanceTo(targetEntity.position) : 0;

                // Adaptive mode distance switching
                if (bot.combatState.mode === 'auto' && hasPos) {
                    if (dist <= 6.5 && bot.combatState.currentWeapon !== 'sword') {
                        bot.startSwordPvP(targetEntity);
                    } else if (dist > 8.0 && bot.combatState.currentWeapon !== 'bow' && bot.hasBowAndArrows()) {
                        bot.startBowPvP(targetEntity);
                    }
                }

                // Intelligent Pathfinding & Anti-Stuck Block Traversal
                if (hasPos && bot.combatState.currentWeapon !== 'bow') {
                    // Navigate around blocks when chasing
                    if (bot.pathfinder && typeof bot.pathfinder.setGoal === 'function') {
                        const { goals } = require('mineflayer-pathfinder');
                        if (dist > 2.8) {
                            const curGoal = bot.pathfinder.goal;
                            const isFollowingTarget = curGoal && curGoal.entity === targetEntity;
                            if (!isFollowingTarget) {
                                try {
                                    bot.pathfinder.setGoal(new goals.GoalFollow(targetEntity, 2.0), true);
                                } catch (e) {}
                            }
                        } else {
                            // Within close striking distance - yield pathfinder so swordpvp can execute strafes and crits
                            if (bot.pathfinder.goal) {
                                try {
                                    bot.pathfinder.setGoal(null);
                                } catch (e) {}
                            }
                        }
                    }

                    // Auto-jump over 1-block steps & obstacles
                    if (bot.entity.isCollidedHorizontally && typeof bot.setControlState === 'function') {
                        bot.setControlState('jump', true);
                        setTimeout(() => {
                            if (typeof bot.setControlState === 'function') bot.setControlState('jump', false);
                        }, 150);
                    }

                    // Anti-stuck watchdog: if stuck attempting to chase, hop and re-route
                    if (!bot.combatState.lastPos) {
                        bot.combatState.lastPos = bot.entity.position.clone();
                        bot.combatState.stuckTicks = 0;
                    } else {
                        const dMoved = bot.entity.position.distanceTo(bot.combatState.lastPos);
                        if (dist > 2.5 && dMoved < 0.08) {
                            bot.combatState.stuckTicks = (bot.combatState.stuckTicks || 0) + 1;
                            if (bot.combatState.stuckTicks >= 6) {
                                if (typeof bot.setControlState === 'function') {
                                    bot.setControlState('jump', true);
                                    setTimeout(() => {
                                        if (typeof bot.setControlState === 'function') bot.setControlState('jump', false);
                                    }, 150);
                                }
                                if (bot.pathfinder && typeof bot.pathfinder.setGoal === 'function') {
                                    try {
                                        const { goals } = require('mineflayer-pathfinder');
                                        bot.pathfinder.setGoal(new goals.GoalFollow(targetEntity, 2.0), true);
                                    } catch (e) {}
                                }
                                bot.combatState.stuckTicks = 0;
                            }
                        } else {
                            bot.combatState.stuckTicks = 0;
                            bot.combatState.lastPos = bot.entity.position.clone();
                        }
                    }
                }

                // If not currently attacking, engage
                const isCustomPvpAttacking = (bot.swordpvp && bot.swordpvp.target) || (bot.bowpvp && bot.bowpvp.target);
                const isPvpAttacking = bot.pvp && bot.pvp.target;
                if (!isCustomPvpAttacking && !isPvpAttacking) {
                    if (bot.combatState.mode === 'bow' && bot.hasBowAndArrows()) {
                        bot.startBowPvP(targetEntity);
                    } else if (bot.combatState.mode === 'sword') {
                        bot.startSwordPvP(targetEntity);
                    } else {
                        bot.startAutoPvP(targetEntity);
                    }
                }
            }
        }

        if (bot.combatState.targets.length === 0) return;

        let bestTarget = null;
        let bestDist = 16;

        for (const entityId in bot.entities) {
            const entity = bot.entities[entityId];
            if (!entity || !entity.isValid || entity === bot.entity) continue;

            const matches = bot.combatState.targets.some(filter => {
                if (typeof filter === 'string') {
                    return (entity.name && entity.name.toLowerCase().includes(filter.toLowerCase())) ||
                           (entity.username && entity.username.toLowerCase().includes(filter.toLowerCase()));
                }
                if (typeof filter === 'function') {
                    return filter(entity);
                }
                return false;
            });

            if (matches) {
                const dist = bot.entity.position.distanceTo(entity.position);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestTarget = entity;
                }
            }
        }

        if (bestTarget) {
            if (bot.swordpvp && typeof bot.swordpvp.attack === 'function' && !bot.swordpvp.target) {
                bot.startSwordPvP(bestTarget);
            } else if (bot.pvp && typeof bot.pvp.attack === 'function' && !bot.pvp.target) {
                bot.pvp.attack(bestTarget);
            } else {
                bot.attackTarget(bestTarget);
            }
        }
    };

    // When target dies or is removed, handle elimination
    bot.on('entityDead', (entity) => {
        if (!entity) return;
        const isHuntTarget = bot.huntTargetName && (
            (entity.username && entity.username.toLowerCase() === bot.huntTargetName) ||
            (entity.name && entity.name.toLowerCase() === bot.huntTargetName)
        );
        const isCurrentTarget = bot.combatState.target && entity.id === bot.combatState.target.id;

        if (isHuntTarget || isCurrentTarget) {
            const killed = bot.huntTargetName || (entity.username || entity.name);
            bot.clearTargets();
            bot.emit('targetKilled', killed);
        }
    });

    bot.on('stoppedAttacking', () => {
        // If target is no longer valid or dead
        if (bot.huntTargetName) {
            const ent = bot.findEntityByName(bot.huntTargetName);
            if (!ent || !ent.isValid) {
                const killed = bot.huntTargetName;
                bot.clearTargets();
                bot.emit('targetKilled', killed);
            }
        }
    });
}

module.exports = {
    load,
    getAttackSpeed,
    getCooldown
};

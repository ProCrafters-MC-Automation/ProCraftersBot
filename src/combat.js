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
        isShieldActive: false
    };

    bot.huntTargetName = null;

    bot.addTarget = function (filter) {
        if (!bot.combatState.targets.includes(filter)) {
            bot.combatState.targets.push(filter);
        }
    };

    bot.clearTargets = function () {
        bot.combatState.targets = [];
        bot.huntTargetName = null;
        bot.setControlState('forward', false);
        bot.setControlState('sprint', false);
        bot.setControlState('jump', false);
        if (bot.pvp && typeof bot.pvp.stop === 'function') {
            bot.pvp.stop();
        }
        if (bot.pathfinder) {
            bot.pathfinder.setGoal(null);
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

    bot.equipForCombat = async function () {
        if (!bot.inventory) return;
        const items = bot.inventory.items();
        const weapon = items.find(i => i.name && (i.name.includes('sword') || i.name.includes('axe')));
        if (weapon) {
            try { await bot.equip(weapon, 'hand'); } catch {}
        }
        const shield = items.find(i => i.name && i.name.includes('shield'));
        if (shield && bot.getEquipmentDestSlot) {
            try { await bot.equip(shield, 'off-hand'); } catch {}
        }
        if (bot.armorManager && typeof bot.armorManager.equipAll === 'function') {
            try { bot.armorManager.equipAll(); } catch {}
        }
    };

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

    bot.attackPlayer = function (targetName) {
        if (!targetName) return false;
        bot.huntTargetName = targetName.toLowerCase().trim();
        if (typeof bot.equipForCombat === 'function') {
            bot.equipForCombat();
        }

        const entity = bot.findEntityByName(bot.huntTargetName);
        if (entity && entity.isValid) {
            if (bot.pvp && typeof bot.pvp.attack === 'function') {
                bot.pvp.attack(entity);
                return true;
            } else if (typeof bot.attackTarget === 'function') {
                bot.attackTarget(entity);
                return true;
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
            const currentPvpTarget = bot.pvp ? bot.pvp.target : null;
            if (!currentPvpTarget || !currentPvpTarget.isValid) {
                const targetEntity = bot.findEntityByName(bot.huntTargetName);
                if (targetEntity && targetEntity.isValid) {
                    if (bot.pvp && typeof bot.pvp.attack === 'function') {
                        if (bot.pvp.target !== targetEntity) {
                            bot.pvp.attack(targetEntity);
                        }
                    } else {
                        bot.attackTarget(targetEntity);
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
            if (bot.pvp && typeof bot.pvp.attack === 'function' && !bot.pvp.target) {
                bot.pvp.attack(bestTarget);
            } else {
                bot.attackTarget(bestTarget);
            }
        }
    };

    // When target dies or is removed, handle elimination
    bot.on('entityDead', (entity) => {
        if (!entity || !bot.huntTargetName) return;
        const matches = (entity.username && entity.username.toLowerCase() === bot.huntTargetName) ||
                        (entity.name && entity.name.toLowerCase() === bot.huntTargetName);
        if (matches) {
            if (bot.pvp && typeof bot.pvp.stop === 'function') {
                bot.pvp.stop();
            }
            const killed = bot.huntTargetName;
            bot.huntTargetName = null;
            bot.emit('targetKilled', killed);
        }
    });

    bot.on('stoppedAttacking', () => {
        // If target is no longer valid or dead
        if (bot.huntTargetName) {
            const ent = bot.findEntityByName(bot.huntTargetName);
            if (!ent || !ent.isValid) {
                const killed = bot.huntTargetName;
                bot.huntTargetName = null;
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

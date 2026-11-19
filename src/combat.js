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

    bot.addTarget = function (filter) {
        if (!bot.combatState.targets.includes(filter)) {
            bot.combatState.targets.push(filter);
        }
    };

    bot.clearTargets = function () {
        bot.combatState.targets = [];
        bot.setControlState('forward', false);
        bot.setControlState('sprint', false);
        bot.setControlState('jump', false);
        if (bot.pvp && typeof bot.pvp.stop === 'function') {
            bot.pvp.stop();
        }
    };

    bot.hasShield = function () {
        if (typeof bot.supportFeature === 'function' && bot.supportFeature('doesntHaveOffHandSlot')) {
            return false;
        }
        const offhand = bot.inventory.slots[45];
        return offhand && offhand.name.includes('shield');
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
}

module.exports = {
    load,
    getAttackSpeed,
    getCooldown
};

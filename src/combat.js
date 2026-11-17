const attackSpeeds = require('../AttackSpeeds.json');

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
        const destSlot = bot.getEquipmentDestSlot ? bot.getEquipmentDestSlot('off-hand') : null;
        if (destSlot !== null && bot.inventory.slots[destSlot]) {
            return (bot.inventory.slots[destSlot].name || '').includes('shield');
        }
        return !!bot.inventory.items().find(i => i.name.includes('shield'));
    };

    bot.equipForCombat = function (prioritizeAxe = false) {
        if (prioritizeAxe) {
            const axe = bot.inventory.items().find(i => i.name.includes('axe'));
            if (axe) {
                bot.equip(axe, 'hand').catch(() => {});
                return;
            }
        }
        const sword = bot.inventory.items().find(i => i.name.includes('sword'));
        if (sword) {
            bot.equip(sword, 'hand').catch(() => {});
        }
        const shield = bot.inventory.items().find(i => i.name.includes('shield'));
        if (shield && bot.getEquipmentDestSlot) {
            bot.equip(shield, 'off-hand').catch(() => {});
        }
        if (bot.armorManager && typeof bot.armorManager.equipAll === 'function') {
            bot.armorManager.equipAll();
        }
    };

    bot.checkForTargets = function () {
        if (bot.combatState.targets.length === 0) return;

        const filter = e => {
            if (!e || e === bot.entity) return false;
            return bot.combatState.targets.includes(e.username) ||
                   bot.combatState.targets.includes(e.name) ||
                   bot.combatState.targets.includes(e.displayName);
        };

        const entity = bot.nearestEntity(filter);
        const minimumDistance = 4.5;

        if (entity && entity.isValid) {
            bot.combatState.mvTick += 1;
            if (bot.combatState.mvTick > 10) {
                bot.combatState.mvTick = 0;
                bot.moveTo(entity.position);
            }

            bot.state = 'combat';
            bot.equipForCombat();

            if (bot.entity.position.distanceTo(entity.position) > minimumDistance) {
                bot.moveTo(entity.position);
            } else {
                if (bot.pvp) {
                    bot.pvp.attack(entity);
                } else {
                    bot.attack(entity);
                }
            }
        } else if (bot.state === 'combat') {
            bot.state = 'idle';
        }
    };
}

module.exports = {
    load
};

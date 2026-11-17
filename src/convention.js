const lodash = require('lodash');

function load(bot) {
    let mining = false;
    let miningCount = 0;
    let miningName = null;

    bot.hasFood = function () {
        try {
            const mcData = require('minecraft-data')(bot.version);
            const data = mcData.foodsArray || [];
            const names = data.map(item => item.name);
            const foundFood = bot.inventory.items().filter(item => names.includes(item.name));
            return foundFood.length > 0;
        } catch (e) {
            return false;
        }
    };

    bot.eat = function (cb) {
        try {
            const mcData = require('minecraft-data')(bot.version);
            const data = mcData.foodsArray || [];
            const names = data.map(item => item.name);
            const foodps = data.map(item => item.foodPoints);

            const availableFood = [];
            bot.inventory.items().forEach(element => {
                const idx = names.indexOf(element.name);
                if (idx !== -1) {
                    element.foodPoints = foodps[idx];
                    availableFood.push(element);
                }
            });

            const bestFood = lodash.maxBy(availableFood, 'foodPoints');
            if (bestFood) {
                bot.substate = 'eating';
                bot.equip(bestFood, 'hand', () => {
                    bot.consume(() => {
                        bot.substate = 'none';
                        if (cb) cb(true);
                    });
                });
                return true;
            }
        } catch (e) {
            console.error('[Eat error]', e.message);
        }
        if (cb) cb(false);
        return false;
    };

    bot.getPlayer = function (username) {
        return bot.players[username] || null;
    };

    bot.locateBlock = function (name) {
        if (!bot.findBlockSync) return null;
        const blocks = bot.findBlockSync({
            point: bot.entity.position,
            matching: name,
            maxDistance: 128,
            count: 1
        });
        return blocks.length > 0 ? blocks[0].position : null;
    };

    function miningTick() {
        if (mining) {
            bot.lookAt(mining);
            const target = bot.blockAt(mining);
            if (target && !bot.targetDigBlock && bot.canDigBlock(target)) {
                if (bot.tool && typeof bot.tool.equipForBlock === 'function') {
                    bot.tool.equipForBlock(target, {}, () => {
                        bot.substate = 'digging';
                        bot.dig(target, () => {
                            bot.stopMoving();
                            mining = false;
                            miningCount -= 1;
                        });
                    });
                } else {
                    bot.substate = 'digging';
                    bot.dig(target, () => {
                        bot.stopMoving();
                        mining = false;
                        miningCount -= 1;
                    });
                }
            }
        } else if (!mining && miningName && miningCount > 0) {
            const position = bot.locateBlock(miningName);
            if (position) {
                bot.mineBlockAt(position);
            } else {
                miningName = null;
            }
        }
    }

    bot.mineBlockAt = function (position) {
        mining = position;
        bot.moveTo(position);
        bot.substate = 'moving';
    };

    bot.mineBlock = function (name, count = 1) {
        bot.state = 'mining';
        miningCount = count;
        miningName = name;
    };

    bot.stopMining = function () {
        mining = false;
        miningCount = 0;
        miningName = null;
        if (bot.stopMoving) bot.stopMoving();
        if (bot.stopDigging) bot.stopDigging();
        if (bot.state === 'mining') {
            bot.state = 'idle';
            bot.substate = 'none';
        }
    };

    bot.mountNearest = function () {
        const mountable = ['boat', 'minecart', 'horse', 'donkey'];
        const filter = e => e.name && mountable.includes(e.name);
        const entity = bot.nearestEntity(filter);
        if (entity) {
            bot.mount(entity);
            return true;
        }
        return false;
    };

    bot.on('physicsTick', miningTick);
}

module.exports = {
    load
};

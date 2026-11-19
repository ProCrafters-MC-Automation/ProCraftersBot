const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const armorManager = require('mineflayer-armor-manager');
const toolPlugin = require('mineflayer-tool').plugin;
const pvp = require('mineflayer-pvp').plugin;
const blockfinderPlugin = require('mineflayer-blockfinder')(mineflayer);

const movement = require('./movement');
const combat = require('./combat');
const convention = require('./convention');

function initBot(options, master, commandHandler) {
    const bot = mineflayer.createBot(options);

    // Initialize custom state
    bot.state = 'idle';
    bot.home = null;
    bot.learnedBlocks = [];
    bot.isLearning = false;
    bot.memory = {};

    // Load standard plugins
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(armorManager);
    bot.loadPlugin(toolPlugin);
    bot.loadPlugin(pvp);
    bot.loadPlugin(blockfinderPlugin);

    // Load custom sub-modules
    movement.load(bot);
    combat.load(bot);
    convention.load(bot);

    // Auto-equip armor and weapons on login/spawn
    bot.once('spawn', () => {
        if (bot.armorManager && typeof bot.armorManager.equipAll === 'function') {
            bot.armorManager.equipAll();
        }

        // Set default pathfinder movements once spawned
        const mcData = require('minecraft-data')(bot.version);
        const { Movements } = require('mineflayer-pathfinder');
        bot.defaultMove = new Movements(bot, mcData);
        bot.defaultMove.canDig = false;
        bot.defaultMove.allow1by1towers = false;
        bot.pathfinder.setMovements(bot.defaultMove);

        // Auto-login commands support (e.g. offline servers with /login)
        if (options.password) {
            setTimeout(() => {
                bot.chat(`/login ${options.password}`);
                bot.chat(`/register ${options.password} ${options.password}`);
            }, 1000);
        }

        setTimeout(() => {
            const sword = bot.inventory.items().find(i => i.name.includes('sword'));
            if (sword) bot.equip(sword, 'hand').catch(() => {});
        }, 150);

        setTimeout(() => {
            const shield = bot.inventory.items().find(i => i.name.includes('shield'));
            if (shield && bot.getEquipmentDestSlot) {
                bot.equip(shield, 'off-hand').catch(() => {});
            }
        }, 250);
    });

    // Chat and whisper dispatching
    if (commandHandler) {
        bot.on('chat', (username, message) => {
            commandHandler(username, message, bot, master, false);
        });
        bot.on('whisper', (username, message) => {
            commandHandler(username, message, bot, master, true);
        });
    }

    // Periodic combat check
    bot.on('physicsTick', () => {
        if (bot.checkForTargets && bot.state !== 'bodyguard') {
            bot.checkForTargets();
        }
    });

    // Auto-protect friendly entities / bots when hurt
    bot.on('entityHurt', (entity) => {
        if (!entity) return;
        const masters = Array.isArray(master) ? master : [master];
        const isMaster = entity.username && masters.includes(entity.username);
        const isSwarmMember = bot.swarmManager && entity.username && Boolean(bot.swarmManager.getBot(entity.username));
        if ((isMaster || isSwarmMember) && bot.state !== 'bodyguard') {
            const Utils = require('./utils');
            const mcData = require('minecraft-data')(bot.version);
            const { Movements } = require('mineflayer-pathfinder');
            const moves = bot.defaultMove || new Movements(bot, mcData);
            Utils.protectFriendly(bot, entity, moves);
        }
    });

    bot.on('kicked', (reason) => {
        console.log(`[Bot Kicked] ${bot.username}:`, reason);
    });

    bot.on('error', (err) => {
        console.error(`[Bot Error] ${bot.username}:`, err.message);
    });

    return bot;
}

module.exports = {
    initBot
};

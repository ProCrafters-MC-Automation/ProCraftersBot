const mineflayer = require('mineflayer');
const toolPlugin = require('mineflayer-tool').plugin;
const armorManager = require('mineflayer-armor-manager');
const pvp = require('mineflayer-pvp').plugin;
const { pathfinder, Movements } = require('mineflayer-pathfinder');

const movement = require('./movement');
const combat = require('./combat');
const convention = require('./convention');
const blockfinder = require('./blockfinder');
const { addChat } = require('./chat');

function initBot(bot, options = {}) {
    const { password, master, commandHandler, role = 'general' } = options;

    bot.state = 'idle';
    bot.substate = 'none';
    bot.role = role;

    // Load plugins
    bot.loadPlugin(pvp);
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(armorManager);
    bot.loadPlugin(toolPlugin);

    // Load custom component systems
    movement.load(bot);
    combat.load(bot);
    convention.load(bot);
    blockfinder.load(bot);

    // Auto-login helper
    const autoLogin = () => {
        if (!password) return;
        addChat(bot, `/register ${password} ${password}`);
        addChat(bot, `/login ${password}`);
    };

    bot.once('spawn', () => {
        try {
            const mcData = require('minecraft-data')(bot.version);
            const defaultMove = new Movements(bot, mcData);
            defaultMove.allowFreeMotion = true;
            defaultMove.allowParkour = true;
            bot.pathfinder.setMovements(defaultMove);
        } catch (e) {}

        console.log(`[Bot Online] ${bot.username} (Role: ${bot.role})`);
        autoLogin();

        if (master && master.length > 0) {
            master.forEach(m => addChat(bot, "I'm online", m));
        }
    });

    // Auto-equip sword and shield when collected
    bot.on('playerCollect', (collector) => {
        if (collector !== bot.entity) return;

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

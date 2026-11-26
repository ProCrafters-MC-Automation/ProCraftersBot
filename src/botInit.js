const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const armorManager = require('mineflayer-armor-manager');
const toolPlugin = require('mineflayer-tool').plugin;
const pvp = require('mineflayer-pvp').plugin;
let customPVP;
try {
    customPVP = require('@nxg-org/mineflayer-custom-pvp').default || require('@nxg-org/mineflayer-custom-pvp');
} catch (e) {}

const blockfinderPlugin = require('mineflayer-blockfinder')(mineflayer);

const movement = require('./movement');
const combat = require('./combat');
const convention = require('./convention');

function initBot(botOrOptions, optionsOrMaster, maybeCommandHandler) {
    let bot;
    let options = {};
    let master = ['Master'];
    let commandHandler = null;

    if (botOrOptions && (typeof botOrOptions.loadPlugin === 'function' || botOrOptions._client)) {
        bot = botOrOptions;
        if (typeof optionsOrMaster === 'object' && optionsOrMaster !== null) {
            options = optionsOrMaster;
            master = options.master || master;
            commandHandler = options.commandHandler || maybeCommandHandler;
        } else if (typeof optionsOrMaster === 'string' || Array.isArray(optionsOrMaster)) {
            master = optionsOrMaster;
            commandHandler = maybeCommandHandler;
        }
    } else {
        options = botOrOptions || {};
        master = optionsOrMaster || options.master || master;
        commandHandler = maybeCommandHandler || options.commandHandler;
        bot = mineflayer.createBot(options);
    }

    // Initialize custom state
    bot.state = options.role || 'idle';
    bot.home = null;
    bot.learnedBlocks = [];
    bot.isLearning = false;
    bot.memory = {};

    // Load standard plugins safe before spawn
    try { if (!bot.pathfinder) bot.loadPlugin(pathfinder); } catch (e) {}
    try { if (!bot.armorManager) bot.loadPlugin(armorManager); } catch (e) {}
    try { if (!bot.tool) bot.loadPlugin(toolPlugin); } catch (e) {}
    try { bot.loadPlugin(blockfinderPlugin); } catch (e) {}

    // Load custom sub-modules
    movement.load(bot);
    combat.load(bot);
    convention.load(bot);

    // Initialize PVP & Pathfinder movements safely once bot.version and registry exist
    const setupCombatAndPathfinder = () => {
        try {
            if (!bot.pathfinder) {
                bot.loadPlugin(pathfinder);
            }
        } catch (e) {}

        // Load @nxg-org/mineflayer-custom-pvp for advanced sword and bow PvP
        if (customPVP && !bot.swordpvp) {
            try {
                bot.loadPlugin(customPVP);
                if (bot.swordpvp && bot.swordpvp.options) {
                    bot.swordpvp.options.critConfig.enabled = true;
                    bot.swordpvp.options.critConfig.mode = 'hop';
                    bot.swordpvp.options.shieldDisableConfig.enabled = true;
                    bot.swordpvp.options.shieldDisableConfig.mode = 'single';
                    bot.swordpvp.options.shieldConfig.enabled = true;
                    bot.swordpvp.options.shieldConfig.mode = 'legit';
                    bot.swordpvp.options.tapConfig.enabled = true;
                    bot.swordpvp.options.tapConfig.mode = 'wtap';
                    bot.swordpvp.options.strafeConfig.enabled = true;
                    bot.swordpvp.options.strafeConfig.mode = { mode: 'intelligent', maxOffset: Math.PI / 2 };
                    bot.swordpvp.options.rotateConfig.enabled = true;
                    bot.swordpvp.options.rotateConfig.mode = 'constant';
                }
                if (bot.bowpvp) {
                    bot.bowpvp.useOffhand = false;
                }
            } catch (e) {
                console.error(`[CustomPVP] Error loading on ${bot.username}:`, e.message);
            }
        }

        try {
            if (!bot.pvp) {
                bot.loadPlugin(pvp);
            }
        } catch (e) {
            console.error(`[PVP] Error loading pvp plugin on ${bot.username}:`, e.message);
        }

        if (bot.version) {
            try {
                const mcData = require('minecraft-data')(bot.version);
                const { Movements } = require('mineflayer-pathfinder');
                bot.defaultMove = new Movements(bot, mcData);
                bot.defaultMove.canDig = false;
                bot.defaultMove.allow1by1towers = false;
                if (bot.pathfinder) {
                    bot.pathfinder.setMovements(bot.defaultMove);
                }
                if (bot.pvp) {
                    bot.pvp.movements = bot.defaultMove;
                    bot.pvp.followRange = 2;
                    bot.pvp.attackRange = 3.5;
                }
            } catch (e) {}
        }

        if (bot.armorManager && typeof bot.armorManager.equipAll === 'function') {
            try { bot.armorManager.equipAll(); } catch (e) {}
        }

        if (typeof bot.equipForCombat === 'function') {
            bot.equipForCombat();
        }
    };

    if (bot.version && bot.registry) {
        setupCombatAndPathfinder();
    } else {
        bot.once('spawn', setupCombatAndPathfinder);
    }

    // Auto-login commands support (e.g. offline servers with /login)
    bot.once('spawn', () => {
        if (options.password) {
            setTimeout(() => {
                bot.chat(`/login ${options.password}`);
                bot.chat(`/register ${options.password} ${options.password}`);
            }, 1000);
        }
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

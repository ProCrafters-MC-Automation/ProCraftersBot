const mineflayer = require('mineflayer');
const { Movements } = require('mineflayer-pathfinder');
const { GoalNear, GoalBlock, GoalXZ, GoalY, GoalInvert, GoalFollow } = require('mineflayer-pathfinder').goals;
const fs = require('fs');
const { createSwarm } = require('./swarm');
const chat = require('./chat');
const jobSelector = require('./individual').handleChat;
const Utils = require('./utils');
let botNames = []
for (i = 6; i < process.argv.length; i++) {
    botNames.push(process.argv[i]);
}
const host = process.argv[2];
const port = parseInt(process.argv[3]);
let password = process.argv[4];
const master = process.argv[5];
const viewDistance = "normal";

const autoLogin = (bot) => {
    chat.addChat(bot, `/register ${password} ${password}`);
    chat.addChat(bot, `/login ${password}`);
    password = null;
};

const botInit = (bot) => {
    bot.loadPlugins([require('mineflayer-pathfinder').pathfinder, require('mineflayer-armor-manager'), require('mineflayer-blockfinder')(mineflayer)]);
    console.log(bot.username, 'initialized');
    // Once we've spawn, it is safe to access mcData because we know the version
    const mcData = require('minecraft-data')(bot.version);
    //    prepFriendlyProtection(mcData);

    const defaultMove = new Movements(bot, mcData);
    defaultMove.allowFreeMotion = true

    bot.on('chat', (username, message) => {
        jobSelector(username, message, bot, master, chat)
    });
    bot.on('whisper', (username, message) => {
        jobSelector(username, message, bot, master, chat, true)
    });
    const startTime = Date.now();
    bot.on('kicked', (reason) => console.log("kicked", reason));
    autoLogin(bot);
    chat.addChat(bot, `I'm online`, master);
};;

let haveSetupProtection = false;
const prepFriendlyProtection = (mcData) => {
    if (haveSetupProtection) return;
    swarm[swarm.length - 1].once('spawn', () => {
        swarm.forEach(bot => {
            const defaultMove = new Movements(bot, mcData);
            defaultMove.allowFreeMotion = true;

            swarm.forEach(other => {
                if (other.username != bot.username) {
                    other.on('health', () => Utils.protectFriendly(bot, other, defaultMove));
                }
            });
            master.forEach(m => {
                let player = bot.players[m];
                if (!player) {
                    console.warn("No player found for auto protect");
                } else {
                    while (!player.entity) { }
                    player.entity.on('health', () => Utils.protectFriendly(bot, player, defaultMove));
                }
            });
        });
    });
    haveSetupProtection = true;
}

const config = {
    host,
    port,
    viewDistance,
    initCallback: botInit
};

module.exports.stop = function () {
    process.exit(0);
};

chat.start();
const swarm = createSwarm(botNames, config, mineflayer);
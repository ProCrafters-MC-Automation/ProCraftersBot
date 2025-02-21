const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { exec } = require('child_process');
const { GoalNear, GoalBlock, GoalXZ, GoalY, GoalInvert, GoalFollow } = goals;
const fs = require('fs');
const { createSwarm, maxPort } = require('./swarm');
const chat = require('./chat');
const { addChat, start } = require('./chat');
const { handleChat: jobSelector } = require('./individual');
const { protectFriendly } = require('./utils');

let botNames = [] //Sin Cos Tan Csc Sec Cot hSin hCos hTan hCsc hSec hCot
for (i = 5; i < process.argv.length; i++) {
    botNames.push(process.argv[i]);
}

server = process.argv[2].split(':')
const host = server[0];
const port = parseInt(server[1]);
let password = process.argv[3];
const master = process.argv[4];
const viewDistance = "normal";

// Function to stop the server on a given port
function stopServerOnPort(port) {
    console.log(`Stopping server on port ${port}...`);
    exec(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
}

// Register a cleanup handler to stop the servers
process.on('beforeExit', () => {
    for (let port = 9000; port <= maxPort; port++) {
        stopServerOnPort(port);
    }
});

const autoLogin = (bot) => {
    addChat(bot, `/register ${password} ${password}`);
    addChat(bot, `/login ${password}`);
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
    addChat(bot, `I'm online`, master);
};;

let haveSetupProtection = true;
const prepFriendlyProtection = (mcData) => {
    if (haveSetupProtection) return;
    swarm[swarm.length - 1].once('spawn', () => {
        swarm.forEach(bot => {
            const defaultMove = new Movements(bot, mcData);
            defaultMove.allowFreeMotion = true;

            swarm.forEach(other => {
                if (other.username != bot.username) {
                    other.on('health', () => protectFriendly(bot, other, defaultMove));
                }
            });
            master.forEach(m => {
                let player = bot.players[m];
                if (!player) {
                    console.warn("No player found for auto protect");
                } else {
                    while (!player.entity) { }
                    player.entity.on('health', () => protectFriendly(bot, player, defaultMove));
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

function stop() {
    process.exit(0);
}

start();
const swarm = createSwarm(botNames, master, config, mineflayer);
module.exports = { stop };
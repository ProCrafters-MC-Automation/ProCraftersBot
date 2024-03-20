const mineflayer = require('mineflayer');
const { Movements } = require('mineflayer-pathfinder');
const { goals } = require('mineflayer-pathfinder');
const bloodhound = require('mineflayer-bloodhound')
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
const personalSpace = 5;

let target = null;

for (let port = 9000; port <= 4 * botNames.length; port++) {
    stopServerOnPort(port);
}

// Function to stop the server on a given port
function stopServerOnPort(port) {
    console.log(`Stopping server on port ${port}...`);
    exec(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
}

// Register a cleanup handler to stop the servers
process.on('beforeExit', () => {
    for (let port = 9000; port <= maxPort + 1000; port++) {
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
    bloodhound(bot)
    bot.id = botNames.indexOf(bot.username) + 1;
	bot.direction = Math.PI * 2 / botNames.length * bot.id;
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
    bot.on('kicked', (reason) => console.log("kicked", reason));
    autoLogin(bot);
    addChat(bot, `I'm online`, master);

    // bot.on('onCorrelateAttack', function (attacker, victim, weapon) {
    //     console.log("Entity: "+ (victim.displayName || victim.username ) + " attacked by: " + (attacker.displayName|| attacker.username) );
    //     //Ignore if the harmed entity is not the boss
    //     if(bodyguard) {
    //         if (victim.username != master) return;
    //         bot.addTarget(attacker);
    //     }
    // }) 

    // bot.on('entityHurt', (entity) => {
    //     console(entity)
    //     if(bodyguard) {
    //         //Ignore if the harmed entity is not the boss
    //         if (entity.username != master) return;

    //         //Select the entity that hurt the boss, by selecting the nearest entity that is not the boss or another Guard
    //         //This needs work :/
    //         target = bot.nearestEntity((entity) => {
    //             return (entity.username != master && !botNames.includes(entity.username || ''));
    //         });
    //         console.log(target)
    //     }
    // });
    bot.on('move', () => {
        const { tasked, bodyguard } = require('./individual');
        if(bodyguard) {
            let boss = bot.players[master];
            //Abort if the boss is not on the server
            if (!boss) return;
            boss = boss.entity;
            //Abort if the boss is not close
            if (!boss) return;

            offset = boss.yaw;
            //Location is where the bot is supposed to be headed
            let location;

            if (!tasked) {
                //If there is no enemy (no combat), return to or keep staying with boss
                let x = Math.sin(bot.direction + offset) * personalSpace;
                let z = Math.cos(bot.direction + offset) * personalSpace;
                //Set the headed location to your position next to boss
                location = boss.position.offset(x, 0, z);
            }
            //Face the location it is heading
            bot.lookAt(location);
            //If it is not yet the amount of blocks "personalSpace" away from the location, walk
            if (bot.entity.position.xzDistanceTo(location) > personalSpace) {
                //Sprint forward
                bot.setControlState('forward', true);
                bot.setControlState('sprint', true);
                //Jump in case it is stuck
                bot.setControlState('jump', bot.entity.isCollidedHorizontally);
            }
        } else {
            
        }
    });
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
const swarm = createSwarm(botNames, config, mineflayer);
module.exports = { stop };
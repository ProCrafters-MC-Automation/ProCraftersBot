const mineflayer = require('mineflayer');
const pvp = require('mineflayer-pvp').plugin;
const { pathfinder } = require('mineflayer-pathfinder');
const deathEvent = require("mineflayer-death-event")

const args = process.argv.slice(2);

const [group1Prefix, group2Prefix, botCount, host, port] = args;

const group1 = [];
const group2 = [];

let deadPlayers = [];
let spawned = false;

// Define Q-values for each bot
const qValues = {};

// Initialize Q-values for each bot
function initializeQValues() {
    for (const bot of group1.concat(group2)) {
        qValues[bot.username] = {
            engageReward: 0, // Q-value for engaging in combat
            killReward: 0, // Q-value for killing an enemy player
        };
    }
}

initializeQValues();

// Update Q-values based on rewards received
function updateQValues(botUsername, engageReward, killReward) {
    if (!qValues[botUsername]) {
        qValues[botUsername] = {
            engageReward: 0,
            killReward: 0,
        };
    }
    const botQValues = qValues[botUsername];
    botQValues.engageReward += engageReward; // Update Q-value for engaging
    botQValues.killReward += killReward; // Update Q-value for killing an enemy
}


function createBot(name, prefix, host, port) {
    const bot = mineflayer.createBot({
        host,
        port,
        username: `${prefix}_${name}`,
    });

    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvp);
    bot.loadPlugin(deathEvent);

    bot.on('login', () => {
        bot.chat(`I am ready to fight!`);
    });

    bot.on('spawn', () => {
        bot.pvp.stop();
    });

    bot.on('physicsTick', () => {
        for (i = 0; i < deadPlayers.length; i++) {
            if ((bot.username).slice(-1) == deadPlayers[i].slice(-1)) {
                console.log(deadPlayers)
                bot.pvp.stop();
            }
        }
    })

    bot.on("playerDeath", (data) => {
        const offenderEntity = Object.values(bot.entities).find(entity => entity.uuid === data.offender.id);
        const victimEntity = Object.values(bot.entities).find(entity => entity.uuid === data.victim.id);
        if (bot.username == offenderEntity.username) {
            console.log(`Winner: ${offenderEntity.username}`);
            const reward = 1;
            updateQValues(offenderEntity.username, 0, reward);
            console.log(qValues)
        } else if (bot.username == victimEntity.username) {
            console.log(`Loser: ${victimEntity.username}`);
            const reward = -2;
            updateQValues(victimEntity.username, 0, reward);
            deadPlayers.push(bot.username);
            console.log(qValues)
        }
    });

    bot.on('chat', (username, message) => {
        if (spawned) {
            if (message === 'fight') {
                bot.chat('Engaging!');
                let target;
                if (prefix !== group1Prefix) {
                    target = group1[bot.username.slice(-1) - 1];
                } else if (prefix !== group2Prefix) {
                    target = group2[bot.username.slice(-1) - 1];
                }

                if (target) {
                    bot.pvp.attack(target.entity);
                    const reward = 0.5;
                    updateQValues(bot.username, reward, 0);
                }
            } else if (message === 'stop') {
                bot.pvp.stop();
            }
        } else {
            bot.chat('All bots have not spawned in yet!');
        }
    });

    return bot;
}

function startFighting() {
    for (let i = 1; i <= botCount; i++) {
        const bot = createBot(i, group1Prefix, host, port);
        group1.push(bot);
    }
    for (let i = 1; i <= botCount; i++) {
        const bot = createBot(i, group2Prefix, host, port);
        group2.push(bot);
    }
    spawned = true;
}

startFighting();

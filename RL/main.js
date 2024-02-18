const mineflayer = require('mineflayer');
const pvp = require('mineflayer-pvp').plugin;
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')

const args = process.argv.slice(2);

const [group1Prefix, group2Prefix, botCount, host, port] = args;

const group1 = [];
const group2 = [];

let deadPlayers = [];

let spawned = false;

function createBot(name, prefix, host, port) {
    const bot = mineflayer.createBot({
        host,
        port,
        username: `${prefix}_${name}`,
    });

    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvp);

    bot.on('login', () => {
        bot.chat(`I am ready to fight!`);
    });

    bot.on('spawn', () => {
        deadPlayers.push(bot.username);
    })

    bot.on('playerKilled', (killedPlayer) => {
        bot.chat(`I defeated ${killedPlayer.username}!`);
    });

    bot.on('physicsTick', () => {

    })

    bot.on('chat', (username, message) => {
        if (message === 'fight') {
            if (spawned) {
                bot.chat('Engaging!');
                if (prefix != group1Prefix) {
                    console.log(bot.username, " ", group1[bot.username.slice(-1) - 1].username)
                    bot.pvp.attack(group1[bot.username.slice(-1) - 1].entity)
                } if (prefix != group2Prefix) {
                    console.log(bot.username, " ", group2[bot.username.slice(-1) - 1].username)
                    bot.pvp.attack(group2[bot.username.slice(-1) - 1].entity)
                }
            } else {
                bot.chat('All bots have not spawned in yet!');
            }
        }
    });
    return bot;
}

async function startFighting() {
    const promises = [];

    for (let i = 0; i < botCount; i++) {
        promises.push(new Promise((resolve) => {
            const bot1 = createBot(i, group1Prefix, host, port);
            const bot2 = createBot(i, group2Prefix, host, port);

            bot1.once('spawn', () => {
                bot2.once('spawn', () => {
                    group1.push(bot1);
                    group2.push(bot2);
                    resolve();
                });
            });
        }));
    }

    await Promise.all(promises);
    spawned = true;
    console.log('All bots spawned and ready to fight!');
}


function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}

startFighting();


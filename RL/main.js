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

function startFighting() {
    for (let i = 1; i <= botCount; i++) {
        const bot = createBot(i, group1Prefix, host, port);
        group1.push(bot)
    }
    for (let i = 1; i <= botCount; i++) {
        const bot = createBot(i, group2Prefix, host, port);
        group2.push(bot)
    }
    spawned = true;
}

startFighting();


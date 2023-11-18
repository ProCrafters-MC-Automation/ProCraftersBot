const mineflayer = require('mineflayer');
const pvp = require('mineflayer-pvp').plugin;

const args = process.argv.slice(2);

const [group1Prefix, group2Prefix, botCount, host, port] = args;

const group1 = [];
const group2 = [];

function createBot(name, prefix, host, port) {
    const bot = mineflayer.createBot({
        host,
        port,
        username: `${prefix}_${name}`,
    });

    bot.loadPlugin(pvp);

    bot.on('spawn', () => {
        bot.chat(`I am ready to fight!`);
    });

    bot.on('playerKilled', (killedPlayer) => {
        bot.chat(`I defeated ${killedPlayer.username}!`);
    });

    bot.on('physicsTick', () => {

    })

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
}

startFighting();

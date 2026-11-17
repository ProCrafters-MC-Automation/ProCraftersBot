/**
 * Swarm compatibility wrapper
 */

const { SwarmManager } = require('./src/swarmManager');
const { createCommandHandler } = require('./src/commandHandler');

let globalSwarmManager = null;

function createSwarm(botNames, master, botConf, mineflayer) {
    const config = {
        host: botConf ? botConf.host : 'localhost',
        port: botConf ? botConf.port : 25565,
        password: 'Password',
        master: Array.isArray(master) ? master : [master],
        viewDistance: botConf ? botConf.viewDistance : 'normal'
    };

    globalSwarmManager = new SwarmManager(config);
    const commandHandler = createCommandHandler(globalSwarmManager);
    globalSwarmManager.setCommandHandler(commandHandler);

    const bots = [];
    (async () => {
        for (const name of botNames) {
            const bot = await globalSwarmManager.spawnBot(name, 'swarm');
            bots.push(bot);
            await new Promise(r => setTimeout(r, 500));
        }
    })();

    return bots;
}

module.exports = {
    createSwarm,
    maxPort: 9000,
    getSwarmManager: () => globalSwarmManager
};

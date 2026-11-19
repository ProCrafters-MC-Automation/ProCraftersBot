/**
 * ProCraftersBot - Main Entry Point
 * Unified Swarm Management with Bodyguard, Commands Printer & Placer Printer
 * Supports both CLI Swarm and Electron GUI modes
 */

if (process.versions.electron || process.argv.includes('--gui')) {
    // Launch Electron GUI mode
    require('./src/gui.js');
} else {
    // Launch CLI Swarm mode
    const { parseConfig } = require('./src/config');
    const { SwarmManager } = require('./src/swarmManager');
    const { createCommandHandler } = require('./src/commandHandler');
    const { start: startChatQueue, stop: stopChatQueue } = require('./src/chat');

    const config = parseConfig();

    console.log('==================================================');
    console.log(' ProCraftersBot - Unified Swarm System');
    console.log(` Target Server: ${config.host}:${config.port}`);
    console.log(` Master(s):     ${config.master.join(', ')}`);
    console.log(` Initial Bots:  ${config.botNames.join(', ')}`);
    console.log('==================================================');

    // Start chat rate-limiter
    startChatQueue();

    // Initialize the swarm manager
    const swarmManager = new SwarmManager(config);
    const commandHandler = createCommandHandler(swarmManager);
    swarmManager.setCommandHandler(commandHandler);

    // Spawn initial swarm bots
    (async () => {
        for (const name of config.botNames) {
            try {
                await swarmManager.spawnBot(name, 'swarm');
                await new Promise(r => setTimeout(r, 600));
            } catch (err) {
                console.error(`Failed to initialize bot ${name}:`, err.message);
            }
        }
    })();

    // Graceful cleanup on exit
    function cleanup() {
        console.log('\nShutting down ProCraftersBot swarm...');
        stopChatQueue();
        swarmManager.stopAll();
        process.exit(0);
    }

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    module.exports = {
        swarmManager,
        stop: cleanup
    };
}

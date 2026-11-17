/**
 * Bodyguards - Standalone / Worker / Module Entrypoint
 */

let workerData = {};
try {
    const wt = require('worker_threads');
    workerData = wt.workerData || {};
} catch (e) {}

const { SwarmManager } = require('./src/swarmManager');
const { bodyguardSystem } = require('./src/bodyguard');

const address = process.argv[2] || workerData.address || 'localhost';
const port = parseInt(process.argv[3] || workerData.port || 25565, 10);
const bossName = process.argv[4] || workerData.bossName || 'Master';
const prefix = process.argv[5] || workerData.prefix || 'Guard';
const botCount = parseInt(process.argv[6] || workerData.botCount || 1, 10);

if (require.main === module || Object.keys(workerData).length > 0) {
    console.log(`[Bodyguards] Launching ${botCount} bodyguard(s) for ${bossName} at ${address}:${port}...`);
    const swarmManager = new SwarmManager({
        host: address,
        port: port,
        master: [bossName]
    });

    bodyguardSystem.spawnNewGuards(swarmManager, bossName, botCount, prefix)
        .then(() => {
            console.log(`[Bodyguards] All ${botCount} guards deployed successfully.`);
        })
        .catch(err => {
            console.error('[Bodyguards Error]', err);
        });
}

module.exports = {
    bodyguardSystem
};

/**
 * Command Printer Worker
 */

let workerData = {};
try {
    const wt = require('worker_threads');
    workerData = wt.workerData || {};
} catch (e) {}

const { SwarmManager } = require('./src/swarmManager');
const { commandsPrinter } = require('./src/commandsPrinter');

const address = workerData.address || process.argv[2] || 'localhost';
const port = parseInt(workerData.port || process.argv[3] || 25565, 10);
const x = workerData.x || process.argv[4] || 0;
const y = workerData.y || process.argv[5] || 64;
const z = workerData.z || process.argv[6] || 0;
const botCount = parseInt(workerData.botCount || process.argv[7] || 1, 10);
const prefix = workerData.prefix || process.argv[8] || 'CmdPrinter';
const imageFile = workerData.imageFile || process.argv[9] || 'image.jpg';

const swarmManager = new SwarmManager({
    host: address,
    port: port
});

commandsPrinter.printWithNewBots(swarmManager, botCount, prefix, { x, y, z }, imageFile, {
    disconnectOnComplete: true,
    onComplete: () => {
        console.log('[CommandsPrinter Worker] Printing completed.');
        process.exit(0);
    }
}).catch(err => {
    console.error('[CommandsPrinter Worker Error]', err);
    process.exit(1);
});

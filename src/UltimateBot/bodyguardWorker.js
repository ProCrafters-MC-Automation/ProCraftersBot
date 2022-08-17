const { parentPort, workerData } = require('worker_threads')
const { exec } = require('child_process');

const command = 'node bodyguards.js ' + workerData.bossName + ' ' + workerData.address + ' ' + workerData.port + ' ' + workerData.botCount + ' ' + workerData.prefix;
console.log(command)
exec(command, (error, stdout, stderr) => {
if (error) {
    console.error(`error: ${error.message}`);
    return;
}
if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
}
console.log(`stdout:\n${stdout}`);
});
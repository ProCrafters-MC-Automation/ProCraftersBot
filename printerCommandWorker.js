const { parentPort, workerData } = require('worker_threads')
const { exec } = require('child_process');

const command = 'node doByCommands.js ' + workerData.prefix + ' ' + workerData.address + ' ' + workerData.port + ' ' + workerData.botCount + ' ' + workerData.x + ' ' + workerData.y + ' ' + workerData.z + ' ' + workerData.imageFile;
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
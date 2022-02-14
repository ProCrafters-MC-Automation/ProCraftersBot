mineflayer = require('mineflayer');
const { exec } = require('child_process');

const user = process.argv[2]
const host = process.argv[3]
const port = process.argv[4]
const version = process.argv[5]

bot = mineflayer.createBot({
    username: user,
    host: host,
    port: port,
    version: version,
})
bot.on('chat', mainChat);
function mainChat(username, message) {
	//Ignore messages that are not from the boss
	if (username != bossName) return;
	//Boss's command parts as an array, e.g. ["kill, "jeb_"]
	let tokens = message.split(' ');

	switch(tokens[0]) {
		case 'Bodyguards':
			var Bodyguards = exec('sh bodyguard.sh',
            (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });

			break;

        case 'PrinterCommands':
            var PrinterCommands = exec('sh printerCommands.sh',
            (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });

            break;
        
        case 'Printer3D':
            var Printer3D = exec('sh printer3D.sh',
            (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });
            break;
        
        case 'Resources':
            var Resources = exec('sh resources.sh',
            (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });
            break;
        
        case 'Ultimate':
            var Ultimate = exec('sh ultimate.sh',
            (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });
            break;
	}
}
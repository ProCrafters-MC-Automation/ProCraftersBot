const { parentPort, workerData } = require('worker_threads')
const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')

const bossName = process.argv[4] || workerData.bossName;
const prefix = process.argv[5] || workerData.prefix;

const server = {
	address: process.argv[2] || workerData.address,
	port: process.argv[3] || workerData.port,
};
const personalSpace = 5;
const botCount = process.argv[6] || workerData.botCount;
var offset = 0;
var bots = [];

var target;
var defaultMove;

function createBot() {
	//Log in as a new bot to the server
	let bot = mineflayer.createBot({
		host: server.address,
		port: server.port,
		username: `${prefix}#${bots.length}`,
		viewDistance: "tiny",
	});
	bot.id = bots.indexOf(bot);
	bot.direction = Math.PI * 2 / botCount * bots.indexOf(bot);
	bot.physicsEnabled = true;

	// Loading plugins
	bot.loadPlugin(pathfinder)

	bot.once("spawn", () => {
		bot.chat('I am the bodyguard of ' + bossName)
		defaultMove = new Movements(bot);
	})

	//Do this every time the bot moves
	bot.on('physicsTick', () => {

		let boss = bot.players[bossName].entity;

		//Abort if the boss is not close
		if (!boss) return;

		offset = boss.yaw;
		//Location is where the bot is supposed to be headed
		let location;

		if (target) {
			//If there is a target (enemy) to attack, make them the target location
			location = target.position;
		} else {
			//If there is no enemy (no combat), return to or keep staying with boss
			let x = Math.sin(bot.direction + offset) * personalSpace;
			let z = Math.cos(bot.direction + offset) * personalSpace;
			//Set the headed location to your position next to boss
			location = boss.position.offset(x, 0, z);
		}

		//Face the location it is heading
		//If in combat, hit the enemy
		if (target) bot.attack(target);
		//If it is not yet the amount of blocks "personalSpace" away from the location, walk
		if (bot.entity.position.xzDistanceTo(location) > personalSpace) {
			// Face the location it is heading
			bot.pathfinder.setMovements(defaultMove);
			bot.pathfinder.setGoal(new goals.GoalBlock(location.x, location.y, location.z));

			bot.lookAt(location);
		}
	});
	return (bot);
}

function populate() {
	//Spawn 1 Guard
	bots.push(createBot());
	if (bots.length < botCount) {
		setTimeout(populate, process.argv[7] * 1000);
	} else {
		//Do this when all bots are spawned
		console.log("Ready!");
	}
}

//Begin the Guard populating!
populate();
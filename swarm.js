const mineflayer = require('mineflayer')
const toolPlugin = require('mineflayer-tool').plugin
const armorManager = require('mineflayer-armor-manager')
const autoeat = require('mineflayer-auto-eat')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const mineflayerViewer = require('prismarine-viewer').mineflayer
const inventoryViewer = require('mineflayer-web-inventory')
const radarViewer = require('mineflayer-radar')(mineflayer);
const movement = require('./movement')
const combat = require('./combat')
const convention = require('./convention')
const blockfinder = require('./blockfinder')
const mother = require('./mineflayer-mother.js').mother;
let maxPort = 9000;

/**
 * Create a swarm with each bot having a name from the given array
 * @param {[]} botNames A config item for each bot
 * @param {mineflayer} mineflayer Mineflayer instance
 * @returns {Swarm} The swarm
 */
const createSwarm = (botNames, master, botConf, mineflayer) => {
    let names = botNames
    
    const personalSpace = 5;
    var offset = 0;
    var target;
    
    const initBot = (name) => {
        const bot = mineflayer.createBot({ ...botConf, username: name });

        let inventoryOptions = { port: maxPort + 2 }

        var radarOptions = { port: maxPort + 3 }
        mineflayerViewer(bot, { port: maxPort, firstPerson: true })
        maxPort++
        mineflayerViewer(bot, { port: maxPort, firstPerson: false })
        maxPort++
        inventoryViewer(bot, inventoryOptions)
        maxPort++
        radarViewer(bot, radarOptions)
        maxPort++

        bot.state = 'idle'    // idle, combat, moving
        bot.substate = 'none'

        // Loading plugins
        bot.loadPlugin(pvp)
        bot.loadPlugin(pathfinder)
        bot.loadPlugin(armorManager)
        bot.loadPlugin(toolPlugin)
        // bot.loadPlugin(autoeat)
        //bot.loadPlugin(mother)

        // Applying listeners
        bot.on('physicTick', onTick)

        // Loading bot components
        movement.load(bot)
        combat.load(bot)
        convention.load(bot)
        blockfinder.load(bot)

        // Bodyguard Master
        bot.id = names.indexOf(name);
        bot.direction = Math.PI * 2 / names.length * names.indexOf(name);
        bot.physicsEnabled = true;

        console.log(bot.id)

        bot.once("spawn", botConf.initCallback.bind(this, bot), () => {
            let botMove = new pathFinder.Movements(bot, mcData);
            botMove.canDig = true;
            botMove.allowParkour = true;
            botMove.allowFreeMotion = true;
            bot.pathfinder.thinkTimeout = 100;
            bot.autoEat.options.priority = "foodPoints"
            bot.autoEat.options.bannedFood = []
            bot.autoEat.options.eatingTimeout = 3

        })

        bot.on('playerCollect', (collector, itemDrop) => {
            if (collector !== bot.entity) return

            setTimeout(() => {
                const sword = bot.inventory.items().find(item => item.name.includes('sword'))
                if (sword) bot.equip(sword, 'hand')
            }, 150)
        })

        //to be tested
        bot.on("physicsTick", () => {
            if (bot.health < 10) {
                const prevItem = bot.heldItem;
                const gapple = bot.inventory.items().find((item) => item.name.includes("apple"));
                const pot = bot.inventory.items().find((item) => item.name.includes("potion"));
                if (gapple) {
                    bot.equip(gapple);
                    bot.autoEat.eat(function (err) {
                        if (err) {
                            return;
                        } else {
                            console.log('I ate an apple!');
                        }
                        bot.equip(prevItem);
                    });
                } else if (pot) {
                    bot.equip(pot);
                    bot.autoEat.eat();
                    bot.equip(prevItem);
                }
            }

            if(bot.state == "bodyguard") {

                let boss = bot.players[master].entity;

                //Abort if the boss is not close
                if (!boss) return;

                offset = boss.yaw;
                //Location is where the bot is supposed to be headed
                let location;

                //If there is no enemy (no combat), return to or keep staying with boss
                let x = Math.sin(bot.direction + offset) * personalSpace;
                let z = Math.cos(bot.direction + offset) * personalSpace;
                //Set the headed location to your position next to boss
                location = boss.position.offset(x, 0, z);
                
                //If it is not yet the amount of blocks "personalSpace" away from the location, walk
                if (bot.entity.position.xzDistanceTo(location) > personalSpace) {
                    // Face the location it is heading
                    const mcData = require('minecraft-data')(bot.version)
                    const movements = new Movements(bot, mcData)

                    bot.pathfinder.setMovements(movements)

                    bot.pathfinder.setGoal(new goals.GoalBlock(location.x, location.y, location.z), false)
                    bot.lookAt(location);
                }
            }
        });

        // Loading plugins
        bot.loadPlugin(pathfinder)

        bot.on('playerCollect', (collector, itemDrop) => {
            if (collector !== bot.entity) return

            setTimeout(() => {
                const shield = bot.inventory.items().find(item => item.name.includes('shield'))
                if (shield) bot.equip(shield, 'off-hand')
            }, 250)
        })

        // The bot eats food automatically and emits these events when it starts eating and stops eating.

        bot.on("autoeat_started", () => {
            console.log("Auto Eat started!")
        })

        bot.on("autoeat_stopped", () => {
            console.log("Auto Eat stopped!")
        })

        // bot.on("health", () => {
        //     if (bot.food === 20) bot.autoEat.disable()
        //     // Disable the plugin if the bot is at 20 food points
        //     else bot.autoEat.enable() // Else enable the plugin again
        // })

        let guardPos = null

        return bot;

        // Events
        function onTick() {
            bot.checkForTargets()
        }
    };



    const bots = [];
    setTimeout(createBots.bind(null, botNames), 0)
    function createBots(botNames) {
        botNames.forEach(name => bots.push(initBot(name)));
    }
    // executeAsync(initBot(name))
    // function executeAsync(func) {
    //     
    // }
    return bots;
}

module.exports = {
    createSwarm: createSwarm,
    maxPort: maxPort
}
const mineflayer = require('mineflayer')
const toolPlugin = require('mineflayer-tool').plugin
const armorManager = require('mineflayer-armor-manager')
const autoeat = require('mineflayer-auto-eat')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const mineflayerViewer = require('prismarine-viewer').mineflayer
const fs = require('fs')
const movement = require('./movement')
const combat = require('./combat')
const convention = require('./convention')
const blockfinder = require('./blockfinder')

/**
 * Create a swarm with each bot having a name from the given array
 * @param {[]} botNames A config item for each bot
 * @param {mineflayer} mineflayer Mineflayer instance
 * @returns {Swarm} The swarm
 */
const createSwarm = (botNames, botConf, mineflayer) => {

    fs.unlink('log.txt', (err) => {
    if (err) {
        throw err;
    }
        console.log("File is deleted.");
    });
    const initBot = (name) => {
        const bot = mineflayer.createBot({ ...botConf, username: name});

        bot.state = 'idle'    // idle, combat, moving
        bot.substate = 'none'
        
        // Loading plugins
        bot.loadPlugin(pvp)
        bot.loadPlugin(pathfinder)
        bot.loadPlugin(armorManager)
        bot.loadPlugin(toolPlugin)
        bot.loadPlugin(autoeat)

        // Applying listeners
        bot.on('physicTick', onTick)

        // Loading bot components
        movement.load(bot)
        combat.load(bot)
        convention.load(bot)
        blockfinder.load(bot)

        //bot.once('spawn', botConf.initCallback.bind(this, bot));

        bot.once("spawn", botConf.initCallback.bind(this, bot), () => {
            bot.autoEat.options.priority = "foodPoints"
            bot.autoEat.options.bannedFood = []
            bot.autoEat.options.eatingTimeout = 3
            mineflayerViewer(bot, {port: 1000, firstPerson: false})
            mineflayerViewer(bot, {port: 1500, firstPerson: true})
        })

        bot.on('playerCollect', (collector, itemDrop) => {
            if (collector !== bot.entity) return

            setTimeout(() => {
                const sword = bot.inventory.items().find(item => item.name.includes('sword'))
                if (sword) bot.equip(sword, 'hand')
            }, 150)
        })

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

        bot.on("health", () => {
        if (bot.food === 20) bot.autoEat.disable()
        // Disable the plugin if the bot is at 20 food points
        else bot.autoEat.enable() // Else enable the plugin again
        })

        let guardPos = null

        return bot;
        
        // Events
        function onTick() {
        bot.checkForTargets()
    }
    };

    

    const bots = [];
    botNames.forEach(name => bots.push(initBot(name)));

    return bots;
}

module.exports = {
    createSwarm: createSwarm
}
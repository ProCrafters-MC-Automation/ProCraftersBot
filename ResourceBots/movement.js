const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const GoalFollow = goals.GoalFollow

let UltimateBot

function load(UltimateBotClass) {
    UltimateBot = UltimateBotClass
    UltimateBot.loadPlugin(pathfinder)

    UltimateBot.moveTo = moveTo
    UltimateBot.stopMoving = stopMoving
}

function moveTo(position) {
    /*
    Pathfinds and move to the given
    coordinates, breaking or placing
    blocks if needed.
    This action can be interrupted
    with stopMoving()
    */
    if (position) {
        const mcData = require('minecraft-data')(bot.version)
        const movements = new Movements(bot, mcData)

        UltimateBot.pathfinder.setMovements(movements)

        UltimateBot.pathfinder.setGoal(new goals.GoalBlock(position.x, position.y, position.z), false)
    }
}

function stopMoving() {
    /*
    Stops any current movement
    actions
    */
    const mcData = require('minecraft-data')(UltimateBot.version)
    const movements = new Movements(UltimateBot, mcData)

    UltimateBot.pathfinder.setMovements(movements)

    UltimateBot.pathfinder.setGoal(new goals.GoalBlock(UltimateBot.entity.position.x, UltimateBot.entity.position.y, UltimateBot.entity.position.z), false)
}

module.exports = {
    load: load,
}
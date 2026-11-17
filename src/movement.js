const { Movements, goals } = require('mineflayer-pathfinder');

function load(bot) {
    bot.moveTo = function (position) {
        if (!position) return;
        try {
            const mcData = require('minecraft-data')(bot.version);
            const movements = new Movements(bot, mcData);
            movements.allowFreeMotion = true;
            bot.pathfinder.setMovements(movements);
            bot.pathfinder.setGoal(new goals.GoalBlock(Math.floor(position.x), Math.floor(position.y), Math.floor(position.z)), false);
        } catch (err) {
            console.error(`[Movement Error] ${bot.username}:`, err.message);
        }
    };

    bot.stopMoving = function () {
        try {
            if (bot.pathfinder) {
                bot.pathfinder.stop();
            }
        } catch (err) {
            console.error(`[Movement Stop Error] ${bot.username}:`, err.message);
        }
    };
}

module.exports = {
    load
};

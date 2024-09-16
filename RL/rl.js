const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;
const mineflayerViewer = require('prismarine-viewer').mineflayer

// Constants
const NUM_BOTS = 1;  // Number of bots per group
const LEARNING_RATE = 0.1;
const DISCOUNT_FACTOR = 0.9;

// Bot groups
const group1 = [];
const group2 = [];

// Q-table for each bot
const qTables = {};

function createBot(username, group) {
    const bot = mineflayer.createBot({
        host: 'localhost',
        port: '25565',
        username: username,
    });

    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvp);

    // Initialize Q-table for this bot
    qTables[username] = {};

    bot.once('spawn', () => {
        const mcData = require('minecraft-data')(bot.version);
        const movements = new Movements(bot, mcData);
        bot.pathfinder.setMovements(movements);

        // Set up bot behavior
        initializeBotBehavior(bot, group);

        if (bot.username == "Bot1Group1") {
            mineflayerViewer(bot, { port: 3000 }) // Start the viewing server on port 3000

            // Draw the path followed by the bot
            const path = [bot.entity.position.clone()]
            bot.on('move', () => {
                if (path[path.length - 1].distanceTo(bot.entity.position) > 1) {
                    path.push(bot.entity.position.clone())
                    bot.viewer.drawLine('path', path)
                }
            })
        }
    });

    return bot;
}

function initializeBotBehavior(bot, group) {
    bot.on('physicsTick', () => {
        // Find nearest enemy
        const enemy = bot.nearestEntity(entity => {
            return entity.type === 'player' && entity.username !== bot.username && !group.includes(entity.username);
        });

        if (enemy) {
            // Get current state (simplified)
            const state = getState(bot, enemy);

            // Choose action based on Q-table (epsilon-greedy policy)
            const action = chooseAction(bot.username, state);

            // Perform action
            performAction(bot, action, enemy);

            // Observe new state and reward
            const newState = getState(bot, enemy);
            const reward = calculateReward(bot, enemy);

            // Update Q-table
            updateQTable(bot.username, state, action, reward, newState);
        }
    });
}

function getState(bot, enemy) {
    // Simplified state representation
    const distance = bot.entity.position.distanceTo(enemy.position);
    const healthDiff = bot.health - enemy.health;
    return `${Math.floor(distance)}_${Math.floor(healthDiff)}`;
}

function chooseAction(botName, state) {
    // Epsilon-greedy action selection
    if (Math.random() < 0.1) {
        return ['attack', 'move_closer', 'move_away'][Math.floor(Math.random() * 3)];
    } else {
        const stateActions = qTables[botName][state] || { 'attack': 0, 'move_closer': 0, 'move_away': 0 };
        return Object.keys(stateActions).reduce((a, b) => stateActions[a] > stateActions[b] ? a : b);
    }
}

function performAction(bot, action, enemy) {
    switch (action) {
        case 'attack':
            bot.attack(enemy);
            break;
        case 'move_closer':
            bot.pathfinder.setGoal(new goals.GoalFollow(enemy, 2));
            break;
        case 'move_away':
            const awayPos = bot.entity.position.offset(enemy.position.x - bot.entity.position.x, 0, enemy.position.z - bot.entity.position.z).scaled(-1);
            bot.pathfinder.setGoal(new goals.GoalBlock(awayPos.x, awayPos.y, awayPos.z));
            break;
    }
}

function calculateReward(bot, enemy) {
    // Simple reward function
    if (enemy.health < enemy.prevHealth) return 1;  // Successful hit
    if (bot.health < bot.prevHealth) return -1;  // Got hit
    return 0;  // No change
}

function updateQTable(botName, state, action, reward, newState) {
    if (!qTables[botName][state]) qTables[botName][state] = { 'attack': 0, 'move_closer': 0, 'move_away': 0 };
    if (!qTables[botName][newState]) qTables[botName][newState] = { 'attack': 0, 'move_closer': 0, 'move_away': 0 };

    const oldQ = qTables[botName][state][action];
    const maxNewQ = Math.max(...Object.values(qTables[botName][newState]));

    qTables[botName][state][action] = oldQ + LEARNING_RATE * (reward + DISCOUNT_FACTOR * maxNewQ - oldQ);
}

// Create bots
for (let i = 1; i <= NUM_BOTS; i++) {
    group1.push(createBot(`Bot${i}Group1`, group1));
    group2.push(createBot(`Bot${i}Group2`, group2));
}

// Main game loop would go here
// This would include logic to reset bots, track overall performance, save Q-tables, etc.
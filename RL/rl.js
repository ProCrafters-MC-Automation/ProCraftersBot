const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;
const fs = require('fs');
const path = require('path');

// Constants
const NUM_BOTS = 3;  // Number of bots per group
const LEARNING_RATE = 0.1;
const DISCOUNT_FACTOR = 0.9;
const EPSILON = 0.1;
const BATTLE_DURATION = 60000;  // 1 minute per battle

const ip = "129.237.90.188"
const port = "25568"

// Bot groups
const group1 = [];
const group2 = [];
let controlBot;

// Q-table for each bot
let qTables = {};

// Ensure the models directory exists
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir);
}

function createBot(username, group) {
    const bot = mineflayer.createBot({
        host: ip,
        port: port,
        username: username,
        // Add other necessary options
    });

    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvp);

    // Initialize or load Q-table for this bot
    loadOrInitializeQTable(username);

    bot.once('spawn', () => {
        const mcData = require('minecraft-data')(bot.version);
        const movements = new Movements(bot, mcData);
        bot.pathfinder.setMovements(movements);

        // Set up bot behavior
        initializeBotBehavior(bot, group);
    });

    return bot;
}

function createControlBot() {
    const bot = mineflayer.createBot({
        host: ip,
        port: port,
        username: 'ControlBot',
        // Add other necessary options
    });

    bot.once('spawn', () => {
        console.log('Control bot spawned');
        bot.chat('/op ControlBot');  // Ensure the control bot has operator privileges
    });

    bot.on('chat', async (username, message) => {
        if (username === bot.username) return;
        if (message === 'start training') {
            console.log('Starting training session');
            await continuousTraining(bot);
        }
    });

    return bot;
}

function loadOrInitializeQTable(botName) {
    const filename = path.join(modelsDir, `${botName}_model.json`);
    if (fs.existsSync(filename)) {
        const data = fs.readFileSync(filename, 'utf8');
        qTables[botName] = JSON.parse(data);
        console.log(`Loaded existing model for ${botName}`);
    } else {
        qTables[botName] = {};
        console.log(`Initialized new model for ${botName}`);
    }
}

function initializeBotBehavior(bot, group) {
    let isFighting = false;

    bot.on('chat', (username, message) => {
        if (username === 'ControlBot' && message === 'fight') {
            isFighting = true;
        }
    });

    bot.on('physicsTick', () => {
        if (!isFighting) return;

        const enemy = bot.nearestEntity(entity => {
            return entity.type === 'player' && entity.username !== bot.username && !group.includes(entity.username);
        });

        if (enemy) {
            const state = getState(bot, enemy);
            const action = chooseAction(bot.username, state);
            performAction(bot, action, enemy);
            const newState = getState(bot, enemy);
            const reward = calculateReward(bot, enemy);
            updateQTable(bot.username, state, action, reward, newState);
        }
    });
}

function getState(bot, enemy) {
    const distance = bot.entity.position.distanceTo(enemy.position);
    const healthDiff = bot.health - enemy.health;
    const botWeapon = bot.heldItem ? bot.heldItem.name : 'none';
    const enemyWeapon = enemy.heldItem ? enemy.heldItem.name : 'none';
    return `${Math.floor(distance / 2)}_${Math.floor(healthDiff / 5)}_${botWeapon}_${enemyWeapon}`;
}

function chooseAction(botName, state) {
    if (Math.random() < EPSILON) {
        return ['attack', 'move_closer', 'move_away', 'equip_weapon', 'use_shield'][Math.floor(Math.random() * 5)];
    } else {
        if (!qTables[botName][state]) {
            qTables[botName][state] = { 'attack': 0, 'move_closer': 0, 'move_away': 0, 'equip_weapon': 0, 'use_shield': 0 };
        }
        const stateActions = qTables[botName][state];
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
        case 'equip_weapon':
            equipBestWeapon(bot);
            break;
        case 'use_shield':
            useShield(bot);
            break;
    }
}

function equipBestWeapon(bot) {
    const weapons = bot.inventory.items().filter(item => item.name.includes('sword') || item.name.includes('axe'));
    if (weapons.length > 0) {
        const bestWeapon = weapons.reduce((best, current) => current.metadata > best.metadata ? current : best);
        bot.equip(bestWeapon, 'hand');
    }
}

function useShield(bot) {
    const shield = bot.inventory.items().find(item => item.name === 'shield');
    if (shield) {
        bot.equip(shield, 'off-hand');
    }
}

function calculateReward(bot, enemy) {
    let reward = 0;
    if (enemy.health < enemy.prevHealth) reward += 2;
    if (bot.health < bot.prevHealth) reward -= 2;
    if (bot.entity.position.distanceTo(enemy.position) < 3) reward += 0.5;
    if (bot.heldItem && (bot.heldItem.name.includes('sword') || bot.heldItem.name.includes('axe'))) reward += 0.5;
    return reward;
}

function updateQTable(botName, state, action, reward, newState) {
    if (!qTables[botName][state]) {
        qTables[botName][state] = { 'attack': 0, 'move_closer': 0, 'move_away': 0, 'equip_weapon': 0, 'use_shield': 0 };
    }
    if (!qTables[botName][newState]) {
        qTables[botName][newState] = { 'attack': 0, 'move_closer': 0, 'move_away': 0, 'equip_weapon': 0, 'use_shield': 0 };
    }

    const oldQ = qTables[botName][state][action];
    const maxNewQ = Math.max(...Object.values(qTables[botName][newState]));

    qTables[botName][state][action] = oldQ + LEARNING_RATE * (reward + DISCOUNT_FACTOR * maxNewQ - oldQ);
}

function saveModel(botName) {
    const filename = path.join(modelsDir, `${botName}_model.json`);
    fs.writeFileSync(filename, JSON.stringify(qTables[botName]));
    console.log(`Model saved for ${botName} to ${filename}`);
}

// Create bots
for (let i = 1; i <= NUM_BOTS; i++) {
    group1.push(createBot(`Bot${i}Group1`, group1));
    group2.push(createBot(`Bot${i}Group2`, group2));
}

// Create control bot
controlBot = createControlBot();

async function resetArena(controlBot) {
    await controlBot.chat('/fill -10 4 -10 10 4 10 stone');
    await controlBot.chat('/fill -9 5 -9 9 5 9 air');
}

async function teleportBots(controlBot, bot1, bot2) {
    await controlBot.chat(`/tp ${bot1.username} -5 5 0`);
    await controlBot.chat(`/tp ${bot2.username} 5 5 0`);
}

async function healBots(controlBot, bot1, bot2) {
    await controlBot.chat(`/effect give ${bot1.username} minecraft:instant_health 1 10`);
    await controlBot.chat(`/effect give ${bot2.username} minecraft:instant_health 1 10`);
}

async function runBattle(controlBot, bot1, bot2) {
    console.log(`Starting battle between ${bot1.username} and ${bot2.username}`);

    await resetArena(controlBot);
    await teleportBots(controlBot, bot1, bot2);
    await healBots(controlBot, bot1, bot2);

    // Start the fight
    await controlBot.chat('fight');

    let winner = null;
    const battleStart = Date.now();

    while (!winner && Date.now() - battleStart < BATTLE_DURATION) {
        if (bot2.health <= 0) winner = bot1;
        if (bot1.health <= 0) winner = bot2;
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!winner) {
        winner = bot1.health > bot2.health ? bot1 : bot2;
    }

    console.log(`Battle ended. Winner: ${winner.username}`);
    return winner;
}

async function continuousTraining(controlBot) {
    while (true) {
        for (let i = 0; i < NUM_BOTS; i++) {
            const bot1 = group1[i];
            const bot2 = group2[i];

            const winner = await runBattle(controlBot, bot1, bot2);

            saveModel(winner.username);

            console.log(`Model saved for ${winner.username}`);

            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

console.log('System initialized. Type "start training" in the Minecraft chat to begin the training process.');
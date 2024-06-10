const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalFollow } = goals;

const QLearning = require('./qLearning'); // Import the Q-learning module (we'll create this next)

const createBot = (username) => {
  const bot = mineflayer.createBot({
    host: 'localhost', // Minecraft server address
    port: 25565,       // Minecraft server port
    username: username // Bot username
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    const defaultMove = new Movements(bot, require('minecraft-data')(bot.version));
    bot.pathfinder.setMovements(defaultMove);
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    if (message === 'fight') {
      const target = bot.players[username].entity;
      if (target) {
        engagePvP(bot, target);
      }
    }
  });

  return bot;
};

const engagePvP = (bot, target) => {
  const qLearning = new QLearning(bot); // Initialize Q-learning for the bot
  const attackInterval = setInterval(() => {
    const distance = bot.entity.position.distanceTo(target.position);
    if (distance < 3) {
      bot.attack(target);
      qLearning.reward(1); // Reward for hitting the target
    } else {
      bot.pathfinder.setGoal(new GoalFollow(target, 1));
      qLearning.penalize(0.1); // Penalize for being far from the target
    }
  }, 100);

  bot.on('entityHurt', (entity) => {
    if (entity === target) {
      qLearning.reward(5); // Higher reward for successfully hurting the target
    } else if (entity === bot.entity) {
      qLearning.penalize(1); // Penalize for getting hurt
    }
  });

  bot.on('death', () => {
    clearInterval(attackInterval);
    qLearning.penalize(10); // Higher penalty for dying
  });
};

// Export the createBot function
module.exports = { createBot };

const { createBot } = require('./bot');

const bot1 = createBot('Bot1');
const bot2 = createBot('Bot2');

const startFight = () => {
  bot1.chat('fight');
  bot2.chat('fight');
};

setTimeout(startFight, 10000); // Start the fight after 10 seconds

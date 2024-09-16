const mineflayer = require('mineflayer')

const bot = mineflayer.createBot({
  host: '10.90.242.205', // minecraft server ip
  port: '25565',
  username: 'Bot', // username or email, switch if you want to change accounts
})

bot.on('chat', (username, message) => {
  if (username === bot.username) return
  bot.chat(message)
})

// Log errors and kick reasons:
bot.on('kicked', console.log)
bot.on('error', console.log)
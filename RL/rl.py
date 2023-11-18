import mineflayer

# Create a bot instance
bot = mineflayer.create_bot('localhost', 25565)

# Spawn the bot at position 0, 0, 0
bot.chat('/spawn 0 0 0')

# Move the bot forward
bot.move_forward()

# Attack the nearest enemy
bot.attack_nearest_enemy()


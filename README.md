# ProCraftersBot
A handful of bots that will automate Minecraft tasks. This includes [PvP Bot](###Ultimate-Bots), [Bodyguard Bots](###Bodyguard-Bots), and [Printer Bots](###Printer-Bots).
## Appendix

## ProCrafters Bots
### [Ultimate Bots](https://github.com/ProCrafters-MC-Automation/ProCraftersBot/tree/main/UltimateBot)
  - 💞 Cool-looking output messages
  - 🤖 Operator rank system
  - 🌐 Pathfinding
  - 🗡️ Combat and PVP
  - ⛏️ Block mining
  - 🎒 Inventory management
  - 🍒 Automatic food management
  - 🛡️ Automatic armor management
  - 🔧 Utility commands
  - Features:
    - 1->N bots,  put the names of the bots in the command
    - Control all bots with "`swarm`" or specific bots with their name
    - Bots will defend themselves and other nearby bots and friendly players when they take damage

#### Commands List
  - Status: Prints out ‘HP: [Health of Bots] Food: [Saturation]’
    - Command: `swarm/bot_name status`
  - Target: Bot(s) try to kill the player, if and only if player is close to the Bot(s).
    - Command: `swarm/bot_name target [Player to kill]`
  - Come: Bot(s) comes to the boss's location when the message is sent, and stays their
    - Command: `swarm/bot_name come`
  - Follow: Bots(s) Follows the boss  (say stop to make bot stop following).
    - Command: `swarm/bot_name follow`
  - Stop: Bot(s) stops what they are doing right away.
    - Command: `swarm/bot_name stop`
  - Info: Bot(s) outputs `Info about [playerName] Pos: [x, y, z] Vel: [velocity]`
    - Command: `swarm/bot_name info`
  - Print: Starts the printer bots to print a 2D image
    - Placer: Starts a printer bot who prints a 2D image by placing.
    - Placer: `swarm/bot_name placer [x of the origin] [y of the origin] [z of the origin] [imageFile]`
    - Command: Starts a printer bot who prints a 2D image by executing commands.
    - Command: `swarm/bot_name command [x of the origin] [y of the origin] [z of the origin] [botCount] [prefix] [imageFile]`
  - Inventory: Lists the number of items the Bot(s) has of a item.
    - Command: `swarm/bot_name inventory`
  - Drop: Bot(s) drops the amount of items requested by the user unless the amount < request.
    - Command: `swarm/bot_name drop [item_name] [quantity]`
  - Harvest/ Mine: Bot(s) mine the blocks requested by the user.
    - Command: `swarm/bot_name harvest/ mine [count] [block]`
  - Find: Finds all the one block the user requested to find.
    - Command: `swarm/bot_name find [block]`
  - Collect: Collects all the drops near the bot.
    - Command: `swarm/bot_name collect`
  - Goto/ Go: Bot(s) go to the exact coordinates entered by the user.
    - Home: Bot(s) go to the coordinates of home, previously set by the user.
    - Command: `swarm/bot_name goto/go [x] [y] [z]`/ `swarm/bot_name goto/go home`
  - Learn: Debugging tool to output the actions done by the user.
    - Command: `swarm/bot_name learn`
  - Learn Stop: Stops debugging tool to output the actions done by the user.
    - Command: `swarm/bot_name learnStop`
  - Craft: Crafts the object entered by the user
    - Command: `swarm/bot_name craft [block]/[item]`
  - Set Home: Sets the home where the Bot(s) is/are, that the bot can go to when said to by the user, see Goto/ Go.
    - Command: `swarm/bot_name setHome`
  - Say: Bot(s) says exactly what you write after 'say ', the bot can say commands this way.
    - Command: `swarm/bot_name say [message]/[command]`
  - Use: Uses the item on the hotbar slot it currently is in.
    - Command: `swarm/bot_name use`
  - Disuse: Uses the item on the hotbar slot it currently is in.
    - Command: `swarm/bot_name disuse`
  - Leave: All the bots leave, no command can revert this except starting the bots again.
    - Command: `swarm/bot_name leave`
  - Locate: Bot(s) finds all entities that matches the entity entered by the user.
    - Command: `swarm/bot_name locate [entity]`
  - Remember: Remembers as many words/ numbers or whatever as needed after 'remember '.
    - Command: `swarm/bot_name remember [to_remember]`
  - Value of: Outputs the thing told to the bot[s] previously, this won't erase the memory.
    - Command: `swarm/bot_name valueOf`
  - Guard: Guards the area against monsters where the user is.
    - Command: `swarm/bot_name guard`
  - Bodyguards: Starts bots that guard the boss with the Username. - `[bot who spawned bodyguards]Boss #[Bot Number]`
    - Command: `swarm/bot_name bodyguards [botCount]`
  - Selfguard: Starts bots that guard the boss with the Username. - `[bot who spawned bodyguards]Bot #[Bot Number]`
    - Command: `swarm/bot_name selfguard [botCount]`
### [Bodyguard Bots](https://github.com/ProCrafters-MC-Automation/ProCraftersBot/tree/main/BodyguardBots)
  - Minecraft bots that protects a player with x amount of bots
 
#### Commands List
  - Kill: Bodyguards kill the player indicated by the Boss.
    - Command: `kill [user_name]`
  - Halt: Bodyguards stop killing the player and return to Boss.
    - Command: `halt`
  - Cease: Bodyguards leave, there is no command to undo this except starting them again from the gui, or via the Ultimate Bots.
### [Printer Bots](https://github.com/ProCrafters-MC-Automation/ProCraftersBot/tree/main/PrinterBots)
  - Minecraft Bot that prints images with blocks 
#### Placer Printer
  - Draw: Prints the image entered in the GUI.
    - Command: `draw`
  - Sheep: Gets the blocks from the sheep.
    - Command: `sheep [block_of_wool]`

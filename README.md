# ProCraftersBot - Unified Minecraft Automation Swarm

ProCraftersBot is a unified, modular multi-bot system for Minecraft (Mineflayer), combining the features of the swarm bots, bodyguard bots, commands printer, and placer printer under a single, tidy architecture.

---

## Features

- **Unified Swarm Architecture**: Control bots individually (`<botName> <command>`) or as an entire fleet (`swarm <command>`).
- **Flexible Bodyguard System**:
  - Assign **existing bots** from the swarm to bodyguard the user in dynamic circular formation.
  - Dynamically spawn **new bots** to join the server and bodyguard the user.
  - Automatic threat detection, shield defense, weapon equipping, and boss defense.
- **Commands 2D Printer**:
  - Print images into Minecraft using optimized `/setblock` and `/fill` commands with scaffold placement.
  - Choose **which existing bots** execute the command print (split across chunks).
  - Or spawn **new bots** that join the server, print, and finish.
- **Placer 2D Printer**:
  - Physically place blocks in the world matching image colors using predefined palettes (concrete, wool, glass, terracotta, etc.).
  - Works with **existing bots** or **new bots**.
  - Supports Creative mode inventory feeding and Survival block placement.
- **Full Utility & Survival Capabilities**: Pathfinding, auto-eating, mining, hunting, drop collection, crafting, and PvP combat.

---

## Installation & Running

```bash
# Install dependencies
npm install

# Start with default options (localhost:25565, Master user, Alpha & Beta bots)
npm start

# Custom launch arguments:
# Format: node index.js <host:port|host port> <password> <master> [botNames...]
node index.js localhost:25565 Password Steve Alpha Beta Gamma

# Run unit tests
npm test
```

---

## Command Reference

Send commands via in-game Minecraft chat or whisper. Commands can target an individual bot (`Alpha <command>`) or all bots (`swarm <command>`).

### 1. Bodyguard Commands

- **Use Existing Bots**:
  - `<botName> bodyguard [target]` - Makes this bot bodyguard the player (default: you).
  - `swarm bodyguard [target]` - Makes all active bots bodyguard the player.
  - `swarm bodyguard existing <bot1,bot2|all> [target]` - User specifies exactly which existing bots become bodyguards.
- **Spawn New Bodyguards**:
  - `swarm bodyguard new <count> [prefix] [target]` - Spawns `<count>` new bots that join the server and protect the target.
  - `swarm bodyguards <count>` - (Backward-compatible) Spawns `<count>` new bodyguard bots for the boss.
- **Combat & Control**:
  - `kill <player>` / `target <player>` - Orders bodyguards (or bot) to attack the specified target.
  - `halt` - Disengages bodyguards from combat and orders them back into formation.
  - `<botName|swarm> bodyguard stop` - Stops bodyguard duty and returns bots to idle state.
  - `swarm bodyguard dismiss [prefix]` - Disconnects spawned bodyguard bots.

---

### 2. Commands Printer (`print command`)

Prints images onto the server using Minecraft `/setblock` and `/fill` commands.

- **Using Existing Bots**:
  - `swarm print command existing <bot1,bot2|all> <x> <y> <z> [imageFile]` - User chooses which existing bots print the image.
  - `<botName> print command <x> <y> <z> [imageFile]` - Uses that existing bot to print.
  - `swarm print command <x> <y> <z> [imageFile]` - Splits the work across all existing swarm bots.
- **Using New Bots**:
  - `swarm print command new <count> <prefix> <x> <y> <z> [imageFile]` - Spawns `<count>` new bots to join and perform command printing.
  - `swarm print command <x> <y> <z> <count> <prefix> <imageFile>` - (Backward-compatible syntax).
- **Stop**:
  - `swarm print stop` - Stops active printing.

---

### 3. Placer Printer (`print placer`)

Physically builds images in-game by placing blocks.

- **Using Existing Bots**:
  - `swarm print placer existing <bot1,bot2|all> <x> <y> <z> [imageFile] [palette] [size]` - Existing bots place blocks.
  - `<botName> print placer <x> <y> <z> [imageFile] [palette] [size]` - That bot places blocks.
  - `swarm print placer <x> <y> <z> [imageFile] [palette] [size]` - All existing bots place blocks.
- **Using New Bots**:
  - `swarm print placer new <count> <prefix> <x> <y> <z> [imageFile] [palette] [size]` - Spawns `<count>` new bots to join and place blocks.
- **Parameters**:
  - `palette`: `concrete` (default), `glass`, `terracotta`, `wool`, or combined `concrete+wool`.
  - `size`: Target dimensions, e.g. `32x32` or `64x64`.

---

### 4. General Bot Commands

- `status` - Returns bot health, food, role, and current state.
- `bots` - Lists all currently connected bots and their roles.
- `come` - Navigates to the commanding player.
- `follow [player]` - Follows the player.
- `goto <x> <y> <z>` / `goto <player>` / `goto home` - Pathfinds to coordinates, player, or saved home.
- `setHome` - Sets the current position as home.
- `stop` - Halts all movement, mining, combat, or printing tasks.
- `inventory` - Displays current inventory items.
- `drop <item>` - Drops matching item from inventory.
- `harvest <count> <block>` / `mine <count> <block>` - Mines specified blocks.
- `find <block>` - Searches for blocks nearby.
- `collect` - Collects nearby dropped items.
- `hunt <count>` - Hunts passive animals for food.
- `craft <item> [count]` - Crafts items using a nearby crafting table.
- `say <message>` - Makes the bot say a message in chat.
- `leave` - Disconnects the bot.

---

## Architecture Overview

- `src/swarmManager.js`: Centralized manager for all active bots and dynamic bot spawning/removal.
- `src/botInit.js`: Initializes plugins, combat, movement, block finding, eating, and event handlers per bot.
- `src/bodyguard.js`: Dynamic formation geometry, boss tracking, entity defense, and bodyguard lifecycle.
- `src/commandsPrinter.js`: Jimp image loading, color-mapping, `/fill` horizontal optimization, chunk distribution.
- `src/placerPrinter.js`: Physical block placing, palette distance matching, and creative/survival placement.
- `src/commandHandler.js`: Chat & whisper parsing, master verification, and command routing.
- `src/chat.js`: Rate-limited message queue preventing server spam kicks.
- `src/config.js`: Flexible command-line configuration parser.

# ProCraftersBot - Unified Minecraft Automation Swarm & GUI

ProCraftersBot is a unified, modular multi-bot system for Minecraft (Mineflayer), combining the features of the swarm bots, bodyguard bots, commands printer, placer printer, resource bots, and an interactive desktop GUI under a clean, organized architecture.

---

## Features

- **Unified Swarm Architecture**: Control bots individually (`<botName> <command>`) or as an entire fleet (`swarm <command>`).
- **Interactive Desktop GUI**: Modern Electron-based graphical interface with dedicated control panels for:
  - **Connection & Multi-account Manager** (Cracked, Microsoft MSA, EasyMC, proxies, and accounts file).
  - **Bodyguard System**: Assign existing bots or spawn new bots to protect the player with circular formation, auto-defense, and combat controls.
  - **Commands 2D Printer**: Print images in seconds using optimized `/fill` and `/setblock` commands. Choose existing bots or spawn new bots.
  - **Placer 2D Printer**: Physically build images by placing blocks using configurable color palettes (concrete, wool, glass, terracotta). Choose existing bots or spawn new bots.
  - **Swarm Automation Tasks**: One-click Come, Follow, Goto, Relative Move, Dig Hole, Set/Go Home, Harvest/Mine, Craft, Hunt, Drop/Toss, Equip, Scan Nearby, Area Protect, Guard Pos, Learn/Recite, and Stop.
  - **Botting Controls**: Individual bot selection, chat sender, anti-spam, hotbar selection, inventory/chest clicker, manual motion, look controls, Anti-AFK, and Killaura.
  - **Proxy Scraper & Checker**: Built-in SOCKS4 and SOCKS5 proxy scraper and tester.
  - **Scripting Engine**: Run custom scripts on connect, on death, or on respawn.
- **Resource Bots Integration**: Complete excavation (`hole`), surface block analysis (`nearby`), interactive block construction recording (`learn`/`recite`), persistent memory (`remember`/`valueof`), entity detection (`locate`), and automatic friendly entity defense.
- **Support for Recent Minecraft Versions**: Auto-detects server versions and supports recent versions including 1.21.x, 1.20.6, 1.20.4, 1.20.2, 1.20.1, 1.20 down to 1.8.

---

## Installation & Running

```bash
# Install dependencies
npm install

# Option A: Launch Interactive GUI
npm run gui

# Option B: Launch CLI Swarm (default: localhost:25565, Master user, Alpha & Beta bots)
npm start

# Option C: Custom CLI launch arguments
# Format: node index.js <host:port|host port> <password> <master> [botNames...]
node index.js localhost:25565 Password Steve Alpha Beta Gamma

# Run unit tests
npm test
```

---

## In-Game Command Reference

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

### 4. Resource Bots & Automation Commands

- `hole <WxLxD>` - Digs out a specified excavation volume centered at the bot (e.g. `hole 5x5x3`).
- `nearby` - Analyzes and reports counts of visible blocks within 16 blocks.
- `equip <item>` - Equips matching item into main hand (e.g. `equip diamond_sword`).
- `drop [amount] <item>` - Tosses matching item and quantity directly to the commanding player.
- `protect` - Defends area by attacking the nearest hostile mob within range.
- `guard` - Guards the commanding player's location against hostile monsters.
- `move <x> <y> <z>` - Relative coordinate movement offset from bot's current position.
- `learn` / `learnstop` (or `recite`) - Starts recording player block modifications and recites learned instructions upon completion.
- `locate <player|entity>` - Locates coordinates of target player or mob.
- `remember <key> <value>` / `valueof <key>` - Stores and reads arbitrary key-value bot memory.
- `Auto-Protect`: All bots automatically rush to protect masters and fellow swarm bots when damaged.

---

### 5. General Bot Commands

- `status` - Returns bot health, food, role, and current state.
- `bots` - Lists all currently connected bots and their roles.
- `come` - Navigates to the commanding player.
- `follow [player]` - Follows the player.
- `goto <x> <y> <z>` / `goto <player>` / `goto home` - Pathfinds to coordinates, player, or saved home.
- `setHome` - Sets the current position as home.
- `stop` - Halts all movement, mining, combat, or printing tasks.
- `inventory` - Displays current inventory items.
- `harvest <count> <block>` / `mine <count> <block>` - Mines specified blocks.
- `find <block>` - Searches for blocks nearby.
- `collect` - Collects nearby dropped items.
- `hunt <count>` - Hunts passive animals for food.
- `craft <item> [count]` - Crafts items using a nearby crafting table.
- `say <message>` - Makes the bot say a message in chat.
- `leave` - Disconnects the bot.

---

## Architecture Overview

```
ProCraftersBot/
├── index.js                  # Main unified entrypoint (CLI Swarm & Electron launch)
├── index.html                # Desktop GUI interface (all control tabs)
├── package.json              # Dependency manifests and scripts
├── src/                      # Core unified backend modules
│   ├── gui.js                # Electron window manager & state persistence
│   ├── swarmManager.js       # Centralized swarm manager & bot lifecycle
│   ├── botInit.js            # Mineflayer bot setup, plugins, events & auto-protect
│   ├── bodyguard.js          # Circular formation, threat defense & bodyguarding
│   ├── commandsPrinter.js    # Horizontal /fill span optimizer & command generator
│   ├── placerPrinter.js      # Palette block placer & 2D physical builder
│   ├── commandHandler.js     # Chat/whisper parsing & full command routing
│   ├── utils.js              # ResourceBots actions (hole, nearby, protect, craft)
│   ├── combat.js             # Combat ticks, weapon attack cooldowns & shields
│   ├── movement.js           # Pathfinder movements & path generation
│   ├── blockfinder.js        # Block queries and spatial scanning
│   ├── chat.js               # Rate-limited chat queue preventing spam kicks
│   ├── config.js             # CLI argument parser
│   └── data/                 # Attack speeds, color maps, palettes & default images
├── js/                       # GUI client controllers
│   ├── bot.js                # IPC & DOM bridge for swarm, bodyguards, tasks & printers
│   ├── utils.js              # GUI helper utilities & account authenticators
│   └── plugins/              # Anti-AFK & Proxy testing plugins
├── assets/                   # Icons, themes, fonts & application assets
├── style/                    # CSS stylesheets
└── test/                     # Automated unit test suite
```

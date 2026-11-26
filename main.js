/**
 * ProCrafters Advanced PvP Bot
 * Built on mineflayer-custom-pvp (local base)
 * Features:
 *  - Sword PvP: Critical hits (hop/packet), sprint-tapping (w-tap), intelligent strafing,
 *               shield defense, and axe shield-breaking.
 *  - Bow PvP: Trajectory simulation, shot prediction, velocity compensation, and auto-aim.
 *  - Adaptive Hybrid PvP: Automatically snipes with bow at distance (>6.5m) and seamlessly
 *                         switches to sword and shield for close-quarters combat.
 *  - Dynamic Scaffolding & Towering: Places blocks to bridge gaps and build 1x1 towers to reach
 *                                    elevated or distant targets.
 *  - Intelligent Pathfinding: Obstacle traversal, auto-jump, and anti-stuck watchdog.
 *  - Auto-Weapon Selection: Fast-path hotbar switching preventing hitting targets with scaffolding blocks.
 */

const mineflayer = require('mineflayer');
let customPVP;
try {
    customPVP = require('./lib').default || require('./lib');
} catch (e) {
    customPVP = require('@nxg-org/mineflayer-custom-pvp').default || require('@nxg-org/mineflayer-custom-pvp');
}

const { pathfinder, Movements } = require('mineflayer-pathfinder');
const armorManager = require('mineflayer-armor-manager');
const autoEat = require('mineflayer-auto-eat').plugin;
const readline = require('readline');

// Active Bot Instance
let bot = null;

// ==========================================
// SCAFFOLDING & BLOCK-PLACING HELPER
// ==========================================
function setupScaffolding(botInstance, moves, mcData) {
    if (!moves || !mcData) return;
    moves.allow1by1towers = true;
    moves.placeCost = 1;

    const bannedSubstrings = [
        'air', 'water', 'lava', 'portal', 'barrier', 'structure', 'command',
        'chest', 'furnace', 'table', 'hopper', 'dropper', 'dispenser', 'shulker',
        'anvil', 'tnt', 'bed', 'spawner', 'beacon', 'door', 'gate', 'trapdoor',
        'button', 'lever', 'plate', 'rail', 'piston', 'observer', 'daylight',
        'tripwire', 'redstone', 'repeater', 'comparator', 'torch', 'lantern',
        'campfire', 'cauldron', 'composter', 'flower', 'sapling', 'mushroom',
        'sugar_cane', 'kelp', 'bamboo', 'vine', 'ladder', 'scaffolding'
    ];

    const scaffoldingSet = new Set();
    const scaffoldingList = [];

    if (mcData.blocks) {
        for (const b of Object.values(mcData.blocks)) {
            if (!b || !b.name) continue;
            if (b.boundingBox !== 'block') continue;
            if (b.hardness !== undefined && b.hardness < 0) continue;
            if (moves.gravityBlocks && moves.gravityBlocks.has(b.id)) continue;
            if (moves.interactableBlocks && moves.interactableBlocks.has(b.id)) continue;

            const lower = b.name.toLowerCase();
            if (bannedSubstrings.some(ban => lower.includes(ban))) continue;

            const item = mcData.itemsByName[b.name];
            if (item && item.id) {
                scaffoldingSet.add(item.id);
                scaffoldingList.push(item.id);
            }
        }
    }

    moves.scafoldingBlocks = scaffoldingList;
    moves.scaffoldingSet = scaffoldingSet;

    moves.countScaffoldingItems = function () {
        let count = 0;
        const items = (botInstance && botInstance.inventory && typeof botInstance.inventory.items === 'function')
            ? botInstance.inventory.items()
            : [];
        for (const item of items) {
            if (item && scaffoldingSet.has(item.type)) {
                count += item.count;
            }
        }
        return count;
    };

    moves.getScaffoldingItem = function () {
        const items = (botInstance && botInstance.inventory && typeof botInstance.inventory.items === 'function')
            ? botInstance.inventory.items()
            : [];
        for (const item of items) {
            if (item && scaffoldingSet.has(item.type)) {
                return item;
            }
        }
        return null;
    };
}

// ==========================================
// INVENTORY & WEAPON MANAGEMENT
// ==========================================
function isWeaponItem(item) {
    if (!item || !item.name) return false;
    const name = item.name.toLowerCase();
    if (name.includes('sword')) return true;
    if (name.includes('axe') && !name.includes('pickaxe')) return true;
    if (name === 'trident' || name === 'mace') return true;
    return false;
}

async function equipShield() {
    if (!bot) return;
    if (bot.supportFeature && bot.supportFeature('doesntHaveOffHandSlot')) return;
    try {
        const shield = bot.inventory.items().find(i => i.name && i.name.includes('shield'));
        if (shield && bot.getEquipmentDestSlot && typeof bot.equip === 'function') {
            await bot.equip(shield, 'off-hand');
        }
    } catch (e) {}
}

async function equipSword() {
    if (!bot) return false;
    try {
        // Fast-path: Synchronous hotbar check (slots 36-44)
        if (bot.inventory && bot.inventory.slots) {
            for (let i = 0; i < 9; i++) {
                const item = bot.inventory.slots[36 + i];
                if (isWeaponItem(item)) {
                    if (bot.quickBarSlot !== i && typeof bot.setQuickBarSlot === 'function') {
                        bot.setQuickBarSlot(i);
                    }
                    return true;
                }
            }
        }

        // Secondary: Backpack search
        const weapon = bot.inventory.items().find(i => isWeaponItem(i));
        if (weapon && typeof bot.equip === 'function') {
            await bot.equip(weapon, 'hand');
            return true;
        }
    } catch (e) {}
    return false;
}

async function equipBow() {
    if (!bot) return false;
    try {
        const bow = bot.inventory.items().find(i => i.name && (i.name === 'bow' || i.name === 'crossbow'));
        if (bow && typeof bot.equip === 'function') {
            await bot.equip(bow, 'hand');
            return true;
        }
    } catch (e) {}
    return false;
}

function autoEquipArmor() {
    if (!bot) return;
    if (bot.armorManager && typeof bot.armorManager.equipAll === 'function') {
        try { bot.armorManager.equipAll(); } catch (e) {}
    }
}

function hasBowAndArrows() {
    if (!bot) return false;
    if (bot.bowpvp && typeof bot.bowpvp.hasWeapon === 'function') {
        return bot.bowpvp.hasWeapon('bow') && bot.bowpvp.hasAmmo('bow');
    }
    const items = (bot.inventory && typeof bot.inventory.items === 'function') ? bot.inventory.items() : [];
    const hasBow = items.some(i => i.name && (i.name.includes('bow') || i.name.includes('crossbow')));
    const hasArrows = items.some(i => i.name && i.name.includes('arrow'));
    return hasBow && hasArrows;
}

// ==========================================
// TARGET DISCOVERY & MANAGEMENT
// ==========================================
function findTarget(name) {
    if (!bot) return null;
    if (name) {
        const lower = name.toLowerCase().trim();
        if (bot.players) {
            for (const username in bot.players) {
                if (username.toLowerCase() === lower) {
                    const p = bot.players[username];
                    if (p && p.entity && p.entity.isValid) return p.entity;
                }
            }
        }
        return bot.nearestEntity(e => {
            if (!e || !e.isValid || e === bot.entity) return false;
            if (e.username && e.username.toLowerCase() === lower) return true;
            if (e.name && e.name.toLowerCase() === lower) return true;
            return false;
        });
    }

    // Default: Nearest player (excluding self) or hostile mob
    return bot.nearestEntity(e => {
        if (!e || !e.isValid || e === bot.entity) return false;
        return e.type === 'player';
    }) || bot.nearestEntity(e => {
        if (!e || !e.isValid || e === bot.entity) return false;
        return e.type === 'mob' && e.kind === 'Hostile mobs';
    });
}

// ==========================================
// COMBAT ACTIONS
// ==========================================
async function startSwordPvP(target) {
    if (!bot || !target || !target.isValid) return false;
    bot.combatState.active = true;
    bot.combatState.mode = 'sword';
    bot.combatState.target = target;
    bot.combatState.targetName = target.username || target.name;
    bot.combatState.currentWeapon = 'sword';

    if (bot.bowpvp && typeof bot.bowpvp.stop === 'function') bot.bowpvp.stop();
    autoEquipArmor();
    await equipSword();
    await equipShield();

    // If target is beyond immediate reach or elevated, engage pathfinder GoalFollow to bridge/tower with blocks
    if (bot.pathfinder && bot.entity && bot.entity.position && target.position) {
        const dist = bot.entity.position.distanceTo(target.position);
        const dy = target.position.y - bot.entity.position.y;
        if (dist > 2.8 || dy > 1.2) {
            const { goals } = require('mineflayer-pathfinder');
            bot.pathfinder.setGoal(new goals.GoalFollow(target, 1.8), true);
        }
    }

    if (bot.swordpvp && typeof bot.swordpvp.attack === 'function') {
        bot.swordpvp.attack(target);
    }
    console.log(`[Sword PvP] Attacking ${bot.combatState.targetName} with hop-crits, shield-break & w-tap!`);
    return true;
}

async function startBowPvP(target) {
    if (!bot || !target || !target.isValid) return false;
    if (!hasBowAndArrows()) {
        console.log(`[Bow PvP] Missing bow or arrows; falling back to sword.`);
        return startSwordPvP(target);
    }

    bot.combatState.active = true;
    bot.combatState.mode = 'bow';
    bot.combatState.target = target;
    bot.combatState.targetName = target.username || target.name;
    bot.combatState.currentWeapon = 'bow';

    if (bot.swordpvp && typeof bot.swordpvp.stop === 'function') bot.swordpvp.stop();
    autoEquipArmor();
    await equipBow();

    if (bot.bowpvp && typeof bot.bowpvp.attack === 'function') {
        bot.bowpvp.attack(target, 'bow');
    }
    console.log(`[Bow PvP] Sniping ${bot.combatState.targetName} with trajectory prediction & auto-aim!`);
    return true;
}

async function startAutoPvP(target) {
    if (!bot || !target || !target.isValid) return false;
    bot.combatState.active = true;
    bot.combatState.mode = 'auto';
    bot.combatState.target = target;
    bot.combatState.targetName = target.username || target.name;

    const dist = (bot.entity && bot.entity.position && target.position)
        ? bot.entity.position.distanceTo(target.position)
        : 0;

    if (dist > 6.5 && hasBowAndArrows()) {
        await startBowPvP(target);
        bot.combatState.mode = 'auto';
    } else {
        await startSwordPvP(target);
        bot.combatState.mode = 'auto';
    }
    console.log(`[Auto PvP] Adaptive PvP engaged on ${bot.combatState.targetName}!`);
    return true;
}

function stopCombat() {
    if (!bot) return;
    bot.combatState.active = false;
    bot.combatState.mode = 'idle';
    bot.combatState.target = null;
    bot.combatState.targetName = null;
    bot.combatState.currentWeapon = 'none';
    bot.combatState.stuckTicks = 0;
    bot.combatState.lastPos = null;

    if (bot.swordpvp && typeof bot.swordpvp.stop === 'function') bot.swordpvp.stop();
    if (bot.bowpvp && typeof bot.bowpvp.stop === 'function') bot.bowpvp.stop();
    if (bot.pathfinder) bot.pathfinder.setGoal(null);

    console.log('[PvP Bot] Combat halted.');
}

// ==========================================
// COMMAND CONTROLLER
// ==========================================
function handleCommand(sender, message, isChat = false) {
    if (!bot) return;
    const parts = message.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts[1];

    const reply = (text) => {
        console.log(`[PvP Bot] ${text}`);
        if (isChat) bot.chat(text);
    };

    switch (cmd) {
        case 'sword': {
            const target = findTarget(arg);
            if (!target) return reply(`No target found for: ${arg || 'nearest'}`);
            startSwordPvP(target);
            reply(`Sword PvP engaged on ${target.username || target.name}!`);
            break;
        }

        case 'bow': {
            const target = findTarget(arg);
            if (!target) return reply(`No target found for: ${arg || 'nearest'}`);
            startBowPvP(target);
            reply(`Bow PvP engaged on ${target.username || target.name}!`);
            break;
        }

        case 'auto':
        case 'attack':
        case 'kill': {
            const target = findTarget(arg);
            if (!target) return reply(`No target found for: ${arg || 'nearest'}`);
            startAutoPvP(target);
            reply(`Adaptive PvP engaged on ${target.username || target.name}!`);
            break;
        }

        case 'stop':
        case 'halt': {
            stopCombat();
            reply('Combat stopped.');
            break;
        }

        case 'crit': {
            const mode = arg ? arg.toLowerCase() : 'hop';
            if (['hop', 'packet'].includes(mode)) {
                bot.swordpvp.options.critConfig.mode = mode;
                bot.swordpvp.options.critConfig.enabled = true;
                reply(`Crit mode set to: ${mode}`);
            } else if (mode === 'off') {
                bot.swordpvp.options.critConfig.enabled = false;
                reply('Crits disabled.');
            } else {
                reply('Usage: crit <hop|packet|off>');
            }
            break;
        }

        case 'shield': {
            const mode = arg ? arg.toLowerCase() : 'legit';
            if (['legit', 'blatant'].includes(mode)) {
                bot.swordpvp.options.shieldConfig.mode = mode;
                bot.swordpvp.options.shieldConfig.enabled = true;
                reply(`Shield mode set to: ${mode}`);
            } else if (mode === 'off') {
                bot.swordpvp.options.shieldConfig.enabled = false;
                reply('Shield disabled.');
            } else {
                reply('Usage: shield <legit|blatant|off>');
            }
            break;
        }

        case 'strafe': {
            const mode = arg ? arg.toLowerCase() : 'intelligent';
            if (['intelligent', 'circle', 'random'].includes(mode)) {
                bot.swordpvp.options.strafeConfig.enabled = true;
                bot.swordpvp.options.strafeConfig.mode.mode = mode;
                reply(`Strafe mode set to: ${mode}`);
            } else if (mode === 'off') {
                bot.swordpvp.options.strafeConfig.enabled = false;
                reply('Strafing disabled.');
            } else {
                reply('Usage: strafe <intelligent|circle|random|off>');
            }
            break;
        }

        case 'wtap': {
            const state = arg ? arg.toLowerCase() : 'on';
            if (state === 'on') {
                bot.swordpvp.options.tapConfig.enabled = true;
                reply('W-tap enabled.');
            } else if (state === 'off') {
                bot.swordpvp.options.tapConfig.enabled = false;
                reply('W-tap disabled.');
            } else {
                reply('Usage: wtap <on|off>');
            }
            break;
        }

        case 'scaffold':
        case 'tower':
        case 'placeblocks': {
            const state = arg ? arg.toLowerCase() : 'on';
            if (state === 'on') {
                if (bot.pathfinder && bot.pathfinder.movements) {
                    bot.pathfinder.movements.allow1by1towers = true;
                }
                reply('Block placing & towering enabled.');
            } else if (state === 'off') {
                if (bot.pathfinder && bot.pathfinder.movements) {
                    bot.pathfinder.movements.allow1by1towers = false;
                }
                reply('Block placing & towering disabled.');
            } else {
                reply('Usage: scaffold <on|off>');
            }
            break;
        }

        case 'status': {
            const hp = Math.round(bot.health || 20);
            const food = Math.round(bot.food || 20);
            const weapon = bot.heldItem ? bot.heldItem.name : 'empty';
            const hasBow = hasBowAndArrows();
            const blockCount = (bot.pathfinder && bot.pathfinder.movements && typeof bot.pathfinder.movements.countScaffoldingItems === 'function')
                ? bot.pathfinder.movements.countScaffoldingItems()
                : 0;
            const towerState = (bot.pathfinder && bot.pathfinder.movements && bot.pathfinder.movements.allow1by1towers) ? 'enabled' : 'disabled';
            reply(`HP: ${hp}/20 | Food: ${food}/20 | Weapon: ${weapon} | Towering: ${towerState} (${blockCount} blocks) | BowReady: ${hasBow} | Mode: ${bot.combatState.mode} | Target: ${bot.combatState.targetName || 'None'}`);
            break;
        }

        case 'help': {
            reply('Commands: sword [target] | bow [target] | auto [target] | stop | scaffold <on|off> | crit <mode> | shield <mode> | strafe <mode> | wtap <on|off> | status');
            break;
        }
    }
}

// ==========================================
// BOT FACTORY & INITIALIZATION
// ==========================================
function createPvPBot(options = {}) {
    const host = options.host || process.argv[2] || process.env.MC_HOST || 'localhost';
    const port = parseInt(options.port || process.argv[3] || process.env.MC_PORT || '25565', 10);
    const username = options.username || process.argv[4] || process.env.MC_USER || 'CombatBot';
    const password = options.password || process.argv[5] || process.env.MC_PASS || null;
    const version = options.version || process.argv[6] || process.env.MC_VERSION || false;

    console.log(`[PvP Bot] Starting ${username} -> ${host}:${port}...`);

    const botOptions = {
        host,
        port,
        username,
        viewDistance: 'normal'
    };

    if (password) botOptions.password = password;
    if (version) botOptions.version = version;

    bot = mineflayer.createBot(botOptions);

    // Prevent unhandled connection crashes (AggregateError / ECONNREFUSED / socketClosed)
    bot.on('error', (err) => {
        console.error(`[PvP Bot Error] ${err.message || err.code || err}`);
    });
    bot.on('kicked', (reason) => {
        console.log(`[PvP Bot Kicked] ${typeof reason === 'object' ? JSON.stringify(reason) : reason}`);
    });
    bot.on('end', (reason) => {
        console.log(`[PvP Bot Disconnected] ${reason || 'Connection closed'}`);
    });

    if (bot._client) {
        bot._client.on('error', (err) => {
            console.error(`[PvP Socket Error] ${err.message || err.code || err}`);
        });
        bot._client.on('end', () => {
            console.log('[PvP Socket Closed]');
        });
    }

    process.on('uncaughtException', (err) => {
        if (err && (err.code === 'ECONNREFUSED' || err.name === 'AggregateError' || (err.message && err.message.includes('ECONNREFUSED')))) {
            console.error(`[PvP Bot] Could not connect to Minecraft server at ${host}:${port}. Verify the server is running.`);
        } else {
            console.error('[Uncaught Exception]', err);
        }
    });

    // Load Plugins
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(customPVP);
    bot.loadPlugin(armorManager);
    bot.loadPlugin(autoEat);

    // Combat Controller State
    bot.combatState = {
        active: false,
        mode: 'idle', // 'idle' | 'sword' | 'bow' | 'auto'
        target: null,
        targetName: null,
        currentWeapon: 'none',
        stuckTicks: 0,
        lastPos: null
    };

    bot.once('spawn', () => {
        console.log(`[PvP Bot] ${bot.username} spawned on server!`);

        // 1. Configure Pathfinder Movements with Scaffolding & Towering
        let mcData;
        try {
            mcData = require('minecraft-data')(bot.version);
        } catch (e) {}

        const moves = new Movements(bot, mcData);
        moves.allowFreeMotion = true;
        moves.allowParkour = true;
        moves.allowSprinting = true;
        moves.canDig = false;
        moves.allow1by1towers = true;
        moves.canOpenDoors = true;
        setupScaffolding(bot, moves, mcData);
        bot.pathfinder.setMovements(moves);

        // 2. Configure SwordPvP for Maximum Combat Efficiency
        if (bot.swordpvp && bot.swordpvp.options) {
            bot.swordpvp.options.genericConfig.viewDistance = 128;
            bot.swordpvp.options.genericConfig.attackRange = 3.5;
            bot.swordpvp.options.genericConfig.tooCloseRange = 2.2;
            bot.swordpvp.options.genericConfig.missChancePerTick = 0.0;
            bot.swordpvp.options.genericConfig.hitThroughWalls = false;

            bot.swordpvp.options.critConfig.enabled = true;
            bot.swordpvp.options.critConfig.mode = 'hop';
            bot.swordpvp.options.critConfig.attemptRange = 3.0;
            bot.swordpvp.options.critConfig.reaction = {
                enabled: true,
                maxPreemptiveTicks: 2,
                maxWaitTicks: 6,
                maxWaitDistance: 4.5
            };

            bot.swordpvp.options.tapConfig.enabled = true;
            bot.swordpvp.options.tapConfig.mode = 'wtap';
            bot.swordpvp.options.tapConfig.delay = 0;

            bot.swordpvp.options.strafeConfig.enabled = true;
            bot.swordpvp.options.strafeConfig.mode = {
                mode: 'intelligent',
                maxOffset: Math.PI / 2
            };

            bot.swordpvp.options.shieldConfig.enabled = true;
            bot.swordpvp.options.shieldConfig.mode = 'legit';

            bot.swordpvp.options.shieldDisableConfig.enabled = true;
            bot.swordpvp.options.shieldDisableConfig.mode = 'single';

            bot.swordpvp.options.onHitConfig.enabled = true;
            bot.swordpvp.options.onHitConfig.mode = 'backoff';
            bot.swordpvp.options.onHitConfig.kbCancel = {
                enabled: true,
                mode: 'jump'
            };

            bot.swordpvp.options.rotateConfig.enabled = true;
            bot.swordpvp.options.rotateConfig.smooth = false;
            bot.swordpvp.options.rotateConfig.lookAtHidden = true;
            bot.swordpvp.options.rotateConfig.mode = 'constant';

            bot.swordpvp.options.followConfig.mode = 'standard';
            bot.swordpvp.options.followConfig.distance = 1.8;
            bot.swordpvp.options.followConfig.predictTicks = 2;
        }

        // 3. Configure BowPvP
        if (bot.bowpvp) {
            bot.bowpvp.useOffhand = false;
        }

        // 4. Configure Auto-Eat
        if (bot.autoEat) {
            bot.autoEat.options = {
                priority: 'foodPoints',
                startAt: 14,
                bannedFood: ['rotten_flesh', 'poisonous_potato', 'pufferfish']
            };
        }

        // Wrap attack to ensure weapon is in hand before striking (prevents hitting with scaffolding blocks)
        if (typeof bot.attack === 'function' && !bot._pvpWrappedAttack) {
            const origAttack = bot.attack.bind(bot);
            bot.attack = function (target, swing = true) {
                if (bot.combatState && bot.combatState.currentWeapon !== 'bow') {
                    if (!bot.heldItem || !isWeaponItem(bot.heldItem)) {
                        equipSword();
                    }
                }
                return origAttack(target, swing);
            };
            bot._pvpWrappedAttack = true;
        }

        autoEquipArmor();
        equipShield();

        console.log('[PvP Bot] Combat modules configured! Type "help" or message bot in-game for commands.');
    });

    bot.on('physicsTick', () => {
        if (!bot.combatState.active) return;
        const target = bot.combatState.target;
        if (!target || !target.isValid || !target.position || !bot.entity || !bot.entity.position) return;

        const dist = bot.entity.position.distanceTo(target.position);
        const dy = target.position.y - bot.entity.position.y;

        // Ensure weapon is equipped rather than scaffolding blocks during sword combat
        // Only allow holding a block while actively placing a scaffolding block
        if (bot.combatState.currentWeapon === 'sword') {
            const isPlacing = bot.pathfinder && typeof bot.pathfinder.isBuilding === 'function' && bot.pathfinder.isBuilding();
            if (!isPlacing) {
                if (!bot.heldItem || !isWeaponItem(bot.heldItem)) {
                    equipSword();
                }
            }
        }

        // Pathfinding & block-placing traversal for melee (bridging across gaps & towering up to targets)
        if (bot.pathfinder && bot.combatState.currentWeapon !== 'bow') {
            const { goals } = require('mineflayer-pathfinder');
            const needsPathing = dist > 2.8 || dy > 1.2 || (bot.swordpvp && (!bot.swordpvp.wasVisible || bot.swordpvp.botReach() > 3.0));

            if (needsPathing) {
                const curGoal = bot.pathfinder.goal;
                if (!curGoal || curGoal.entity !== target) {
                    try {
                        bot.pathfinder.setGoal(new goals.GoalFollow(target, 1.8), true);
                    } catch (e) {}
                }
            } else if (dist <= 2.8 && dy <= 1.2 && bot.pathfinder.goal) {
                bot.pathfinder.setGoal(null);
            }
        }

        // Auto-jump over 1-block obstacles while chasing
        if (bot.entity.isCollidedHorizontally && typeof bot.setControlState === 'function') {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 150);
        }

        // Anti-stuck watchdog: hop and recalculate path if halted against an obstacle
        if (bot.combatState.currentWeapon !== 'bow') {
            if (!bot.combatState.lastPos) {
                bot.combatState.lastPos = bot.entity.position.clone();
                bot.combatState.stuckTicks = 0;
            } else {
                const dMoved = bot.entity.position.distanceTo(bot.combatState.lastPos);
                if ((dist > 2.5 || dy > 1.2) && dMoved < 0.08) {
                    bot.combatState.stuckTicks = (bot.combatState.stuckTicks || 0) + 1;
                    if (bot.combatState.stuckTicks >= 6) {
                        if (typeof bot.setControlState === 'function') {
                            bot.setControlState('jump', true);
                            setTimeout(() => bot.setControlState('jump', false), 150);
                        }
                        if (bot.pathfinder) {
                            try {
                                const { goals } = require('mineflayer-pathfinder');
                                bot.pathfinder.setGoal(new goals.GoalFollow(target, 1.8), true);
                            } catch (e) {}
                        }
                        bot.combatState.stuckTicks = 0;
                    }
                } else {
                    bot.combatState.stuckTicks = 0;
                    bot.combatState.lastPos = bot.entity.position.clone();
                }
            }
        }

        // Adaptive mode distance switching
        if (bot.combatState.mode === 'auto') {
            if (dist <= 6.5 && bot.combatState.currentWeapon !== 'sword') {
                console.log(`[Adaptive PvP] Target in melee range (${dist.toFixed(1)}m). Switching to Sword!`);
                startSwordPvP(target);
                bot.combatState.mode = 'auto';
            } else if (dist > 8.0 && bot.combatState.currentWeapon !== 'bow' && hasBowAndArrows()) {
                console.log(`[Adaptive PvP] Target at distance (${dist.toFixed(1)}m). Switching to Bow!`);
                startBowPvP(target);
                bot.combatState.mode = 'auto';
            }
        }
    });

    if (bot.swordpvp) {
        bot.swordpvp.on('attackedTarget', (target, reason, ticks) => {
            const name = target ? (target.username || target.name) : 'target';
            console.log(`[Sword Strike] Hit ${name} | Reason: ${reason} | Cooldown: ${ticks} ticks`);
        });

        bot.swordpvp.on('stoppedAttacking', () => {
            if (bot.combatState.active && bot.combatState.mode === 'sword') {
                console.log('[Sword PvP] Sword combat completed or stopped.');
            }
        });
    }

    if (bot.bowpvp) {
        bot.bowpvp.on('attackedTarget', (target) => {
            const name = target ? (target.username || target.name) : 'target';
            console.log(`[Bow Shot] Arrow released toward ${name}!`);
        });

        bot.bowpvp.on('stoppedAttacking', () => {
            if (bot.combatState.active && bot.combatState.mode === 'bow') {
                console.log('[Bow PvP] Bow combat completed or stopped.');
            }
        });
    }

    bot.on('entityDead', (entity) => {
        if (bot.combatState.target && entity.id === bot.combatState.target.id) {
            console.log(`[PvP Bot] Target ${bot.combatState.targetName} eliminated!`);
            stopCombat();
        }
    });

    // In-Game Chat listener
    bot.on('chat', (sender, message) => {
        if (sender === bot.username) return;
        handleCommand(sender, message, true);
    });

    // Terminal Console CLI
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', (line) => {
        if (!line.trim()) return;
        handleCommand('console', line.trim(), false);
    });

    return bot;
}

if (require.main === module) {
    createPvPBot();
}

module.exports = {
    get bot() { return bot; },
    createPvPBot,
    startSwordPvP,
    startBowPvP,
    startAutoPvP,
    stopCombat,
    equipSword,
    equipBow,
    equipShield,
    setupScaffolding,
    isWeaponItem
};

/**
 * ProCrafters Advanced PvP Bot
 * Powered by @nxg-org/mineflayer-custom-pvp
 * Features:
 *  - Sword PvP: Critical hits (hop/packet), sprint-tapping (w-tap), intelligent strafing,
 *               shield defense, and axe shield-breaking.
 *  - Bow PvP: Trajectory simulation, shot prediction, velocity compensation, and auto-aim.
 *  - Adaptive Hybrid PvP: Automatically snipes with bow at distance (>6.5m) and seamlessly
 *                         switches to sword and shield for close-quarters combat.
 */

const mineflayer = require('mineflayer');
const customPVP = require('@nxg-org/mineflayer-custom-pvp').default || require('@nxg-org/mineflayer-custom-pvp');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const armorManager = require('mineflayer-armor-manager');
const autoEat = require('mineflayer-auto-eat').plugin;
const readline = require('readline');

// ==========================================
// CONFIGURATION & CONNECTION
// ==========================================
const host = process.argv[2] || process.env.MC_HOST || 'localhost';
const port = parseInt(process.argv[3] || process.env.MC_PORT || '25565', 10);
const username = process.argv[4] || process.env.MC_USER || 'CombatBot';
const password = process.argv[5] || process.env.MC_PASS || null;
const version = process.argv[6] || process.env.MC_VERSION || false;

console.log(`[PvP Bot] Starting ${username} -> ${host}:${port}...`);

const botOptions = {
    host,
    port,
    username,
    viewDistance: 'normal'
};

if (password) botOptions.password = password;
if (version) botOptions.version = version;

const bot = mineflayer.createBot(botOptions);

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
    currentWeapon: 'none'
};

// ==========================================
// SPAWN & COMBAT INITIALIZATION
// ==========================================
bot.once('spawn', () => {
    console.log(`[PvP Bot] ${bot.username} spawned on server!`);

    // 1. Configure Pathfinder Movements
    let mcData;
    try {
        mcData = require('minecraft-data')(bot.version);
    } catch (e) {}

    const moves = new Movements(bot, mcData);
    moves.allowFreeMotion = true;
    moves.allowParkour = true;
    moves.allowSprinting = true;
    moves.canDig = false;
    moves.allow1by1towers = false;
    bot.pathfinder.setMovements(moves);

    // 2. Configure SwordPvP for Maximum Combat Efficiency
    if (bot.swordpvp && bot.swordpvp.options) {
        // Generic Combat Distance & Reach
        bot.swordpvp.options.genericConfig.viewDistance = 128;
        bot.swordpvp.options.genericConfig.attackRange = 3.5;
        bot.swordpvp.options.genericConfig.tooCloseRange = 2.2;
        bot.swordpvp.options.genericConfig.missChancePerTick = 0.0;
        bot.swordpvp.options.genericConfig.hitThroughWalls = false;

        // Critical Hits: Hop crits time jump & fall velocity for 1.5x damage on every attack
        bot.swordpvp.options.critConfig.enabled = true;
        bot.swordpvp.options.critConfig.mode = 'hop';
        bot.swordpvp.options.critConfig.attemptRange = 3.0;
        bot.swordpvp.options.critConfig.reaction = {
            enabled: true,
            maxPreemptiveTicks: 2,
            maxWaitTicks: 6,
            maxWaitDistance: 4.5
        };

        // Sprint-Reset / W-Tap: Resets sprint between hits to knock enemy back into combos
        bot.swordpvp.options.tapConfig.enabled = true;
        bot.swordpvp.options.tapConfig.mode = 'wtap';
        bot.swordpvp.options.tapConfig.delay = 0;

        // Intelligent Strafing: Dynamically circles around opponent to dodge and flank
        bot.swordpvp.options.strafeConfig.enabled = true;
        bot.swordpvp.options.strafeConfig.mode = {
            mode: 'intelligent',
            maxOffset: Math.PI / 2
        };

        // Shield Defense: Legit shield raising between attacks
        bot.swordpvp.options.shieldConfig.enabled = true;
        bot.swordpvp.options.shieldConfig.mode = 'legit';

        // Shield Disabling: Auto-detects opponent shield and switches to axe to disable it
        bot.swordpvp.options.shieldDisableConfig.enabled = true;
        bot.swordpvp.options.shieldDisableConfig.mode = 'single';

        // Knockback Reduction: Reduces velocity on taking hit
        bot.swordpvp.options.onHitConfig.enabled = true;
        bot.swordpvp.options.onHitConfig.mode = 'backoff';
        bot.swordpvp.options.onHitConfig.kbCancel = {
            enabled: true,
            mode: 'jump'
        };

        // Aim & Rotations: Precise, continuous target lock
        bot.swordpvp.options.rotateConfig.enabled = true;
        bot.swordpvp.options.rotateConfig.smooth = false;
        bot.swordpvp.options.rotateConfig.lookAtHidden = true;
        bot.swordpvp.options.rotateConfig.mode = 'constant';
    }

    // 3. Configure BowPvP
    if (bot.bowpvp) {
        bot.bowpvp.useOffhand = false;
    }

    // 4. Configure Auto-Eat & Auto-Armor
    if (bot.autoEat) {
        bot.autoEat.options = {
            priority: 'foodPoints',
            startAt: 14,
            bannedFood: ['rotten_flesh', 'poisonous_potato', 'pufferfish']
        };
    }

    autoEquipArmor();
    equipShield();

    console.log('[PvP Bot] Combat modules configured! Type "help" or message bot in-game for commands.');
});

// ==========================================
// INVENTORY & EQUIPMENT HELPERS
// ==========================================
async function equipShield() {
    if (bot.supportFeature('doesntHaveOffHandSlot')) return;
    try {
        const shield = bot.inventory.items().find(i => i.name.includes('shield'));
        if (shield && bot.getEquipmentDestSlot) {
            await bot.equip(shield, 'off-hand');
        }
    } catch (e) {}
}

async function equipSword() {
    try {
        if (bot.inventory && bot.inventory.slots) {
            for (let i = 0; i < 9; i++) {
                const item = bot.inventory.slots[36 + i];
                if (item && item.name && (item.name.includes('sword') || (item.name.includes('axe') && !item.name.includes('pickaxe')))) {
                    if (bot.quickBarSlot !== i && typeof bot.setQuickBarSlot === 'function') {
                        bot.setQuickBarSlot(i);
                    }
                    return true;
                }
            }
        }
        const sword = bot.inventory.items().find(i => i.name && (i.name.includes('sword') || (i.name.includes('axe') && !i.name.includes('pickaxe'))));
        if (sword && typeof bot.equip === 'function') {
            await bot.equip(sword, 'hand');
            return true;
        }
    } catch (e) {}
    return false;
}

async function equipBow() {
    try {
        const bow = bot.inventory.items().find(i => i.name === 'bow' || i.name === 'crossbow');
        if (bow) {
            await bot.equip(bow, 'hand');
            return true;
        }
    } catch (e) {}
    return false;
}

function autoEquipArmor() {
    if (bot.armorManager && typeof bot.armorManager.equipAll === 'function') {
        try { bot.armorManager.equipAll(); } catch (e) {}
    }
}

function hasBowAndArrows() {
    if (!bot.bowpvp) return false;
    return bot.bowpvp.hasWeapon('bow') && bot.bowpvp.hasAmmo('bow');
}

// ==========================================
// TARGET DISCOVERY & MANAGEMENT
// ==========================================
function findTarget(name) {
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
    if (!target || !target.isValid) return false;
    bot.combatState.active = true;
    bot.combatState.mode = 'sword';
    bot.combatState.target = target;
    bot.combatState.targetName = target.username || target.name;
    bot.combatState.currentWeapon = 'sword';

    if (bot.bowpvp) bot.bowpvp.stop();
    autoEquipArmor();
    await equipSword();
    await equipShield();

    // If target is beyond immediate reach, engage pathfinder GoalFollow to navigate around obstacles
    if (bot.pathfinder && bot.entity && bot.entity.position && target.position) {
        const dist = bot.entity.position.distanceTo(target.position);
        if (dist > 2.8) {
            const { goals } = require('mineflayer-pathfinder');
            bot.pathfinder.setGoal(new goals.GoalFollow(target, 2.0), true);
        }
    }

    if (bot.swordpvp) {
        bot.swordpvp.attack(target);
    }
    console.log(`[Sword PvP] Attacking ${bot.combatState.targetName} with hop-crits, shield-break & w-tap!`);
    return true;
}

async function startBowPvP(target) {
    if (!target || !target.isValid) return false;
    if (!hasBowAndArrows()) {
        console.log(`[Bow PvP] Missing bow or arrows; falling back to sword.`);
        return startSwordPvP(target);
    }

    bot.combatState.active = true;
    bot.combatState.mode = 'bow';
    bot.combatState.target = target;
    bot.combatState.targetName = target.username || target.name;
    bot.combatState.currentWeapon = 'bow';

    if (bot.swordpvp) bot.swordpvp.stop();
    autoEquipArmor();
    await equipBow();

    if (bot.bowpvp) {
        bot.bowpvp.attack(target, 'bow');
    }
    console.log(`[Bow PvP] Sniping ${bot.combatState.targetName} with trajectory prediction & auto-aim!`);
    return true;
}

async function startAutoPvP(target) {
    if (!target || !target.isValid) return false;
    bot.combatState.active = true;
    bot.combatState.mode = 'auto';
    bot.combatState.target = target;
    bot.combatState.targetName = target.username || target.name;

    const dist = bot.entity.position.distanceTo(target.position);
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
    bot.combatState.active = false;
    bot.combatState.mode = 'idle';
    bot.combatState.target = null;
    bot.combatState.targetName = null;
    bot.combatState.currentWeapon = 'none';

    if (bot.swordpvp) bot.swordpvp.stop();
    if (bot.bowpvp) bot.bowpvp.stop();
    bot.clearControlStates();
    if (bot.pathfinder) bot.pathfinder.setGoal(null);

    console.log('[PvP Bot] Combat halted.');
}

// ==========================================
// ADAPTIVE TICK LOOP (FOR AUTO HYBRID PVP)
// ==========================================
bot.on('physicsTick', () => {
    if (!bot.combatState.active || bot.combatState.mode !== 'auto') return;
    const target = bot.combatState.target;
    if (!target || !target.isValid) return;

    const dist = bot.entity.position.distanceTo(target.position);

    // Pathfinding & obstacle traversal
    if (bot.pathfinder) {
        const { goals } = require('mineflayer-pathfinder');
        if (dist > 2.8 && bot.combatState.currentWeapon === 'sword') {
            const curGoal = bot.pathfinder.goal;
            if (!curGoal || curGoal.entity !== target) {
                bot.pathfinder.setGoal(new goals.GoalFollow(target, 2.0), true);
            }
        } else if (dist <= 2.8 && bot.pathfinder.goal) {
            bot.pathfinder.setGoal(null);
        }
    }

    // Auto-jump over 1-block obstacles while chasing
    if (bot.entity.isCollidedHorizontally) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 150);
    }

    // If target moved closer than 6.5m, switch from bow to sword
    if (dist <= 6.5 && bot.combatState.currentWeapon !== 'sword') {
        console.log(`[Adaptive PvP] Target in melee range (${dist.toFixed(1)}m). Switching to Sword!`);
        startSwordPvP(target);
        bot.combatState.mode = 'auto';
    }
    // If target moved further than 8.0m and we have bow + ammo, switch to bow
    else if (dist > 8.0 && bot.combatState.currentWeapon !== 'bow' && hasBowAndArrows()) {
        console.log(`[Adaptive PvP] Target at distance (${dist.toFixed(1)}m). Switching to Bow!`);
        startBowPvP(target);
        bot.combatState.mode = 'auto';
    }
});

// ==========================================
// COMBAT EVENTS & FEEDBACK
// ==========================================
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

bot.on('entityDead', (entity) => {
    if (bot.combatState.target && entity.id === bot.combatState.target.id) {
        const name = entity.username || entity.name || 'target';
        console.log(`[PvP Victory] Target ${name} was eliminated!`);
        stopCombat();
    }
});

bot.on('targetBlockingUpdate', (target, blocking) => {
    if (blocking) {
        console.log(`[Shield Counter] Target raised shield! Switching to axe to disable shield.`);
    }
});

// ==========================================
// COMMAND PARSER & DISPATCHER
// ==========================================
function handleCommand(sender, message, isChat = false) {
    const parts = message.trim().split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    const reply = (text) => {
        console.log(`[Output] ${text}`);
        if (isChat) bot.chat(text);
    };

    switch (cmd) {
        case 'sword':
        case 'melee': {
            const target = findTarget(arg);
            if (!target) return reply(`No target found${arg ? ` for "${arg}"` : ''}.`);
            startSwordPvP(target);
            reply(`Sword PvP engaged on ${target.username || target.name}!`);
            break;
        }

        case 'bow':
        case 'shoot':
        case 'snipe': {
            const target = findTarget(arg);
            if (!target) return reply(`No target found${arg ? ` for "${arg}"` : ''}.`);
            startBowPvP(target);
            reply(`Bow PvP engaged on ${target.username || target.name}!`);
            break;
        }

        case 'auto':
        case 'pvp':
        case 'fight':
        case 'kill': {
            const target = findTarget(arg);
            if (!target) return reply(`No target found${arg ? ` for "${arg}"` : ''}.`);
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
            const mode = arg.toLowerCase();
            if (['hop', 'packet', 'shorthop'].includes(mode)) {
                bot.swordpvp.options.critConfig.enabled = true;
                bot.swordpvp.options.critConfig.mode = mode;
                reply(`Critical hits set to mode: ${mode}`);
            } else if (mode === 'off') {
                bot.swordpvp.options.critConfig.enabled = false;
                reply('Critical hits disabled.');
            } else {
                reply('Usage: crit <hop|packet|shorthop|off>');
            }
            break;
        }

        case 'shield': {
            const mode = arg.toLowerCase();
            if (['legit', 'blatant'].includes(mode)) {
                bot.swordpvp.options.shieldConfig.enabled = true;
                bot.swordpvp.options.shieldConfig.mode = mode;
                reply(`Shield mode set to: ${mode}`);
            } else if (mode === 'off') {
                bot.swordpvp.options.shieldConfig.enabled = false;
                reply('Shield defense disabled.');
            } else {
                reply('Usage: shield <legit|blatant|off>');
            }
            break;
        }

        case 'strafe': {
            const mode = arg.toLowerCase();
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
            const state = arg.toLowerCase();
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

        case 'status': {
            const hp = Math.round(bot.health || 20);
            const food = Math.round(bot.food || 20);
            const weapon = bot.heldItem ? bot.heldItem.name : 'empty';
            const hasBow = hasBowAndArrows();
            reply(`HP: ${hp}/20 | Food: ${food}/20 | Weapon: ${weapon} | BowReady: ${hasBow} | Mode: ${bot.combatState.mode} | Target: ${bot.combatState.targetName || 'None'}`);
            break;
        }

        case 'help': {
            reply('Commands: sword [target] | bow [target] | auto [target] | stop | crit <mode> | shield <mode> | strafe <mode> | wtap <on|off> | status');
            break;
        }
    }
}

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

// Error handling
bot.on('error', (err) => {
    const name = bot.username || config.botNames[0] || 'Bot';
    let msg = err.message || err.toString();
    if (err.errors && Array.isArray(err.errors)) {
        msg = err.errors.map(e => e.message || e.code || e).join('; ');
    }
    if (msg.includes('ECONNREFUSED')) {
        msg = `Connection refused at ${config.host}:${config.port}. Ensure your Minecraft server is running.`;
    }
    console.error(`[Bot Error: ${name}]`, msg);
});
bot.on('kicked', (reason) => {
    const name = bot.username || config.botNames[0] || 'Bot';
    console.log(`[Bot Kicked: ${name}]`, reason);
});
bot.on('end', (reason) => {
    const name = bot.username || config.botNames[0] || 'Bot';
    let r = reason || 'Connection ended';
    if (r === 'socketClosed') {
        r = 'socketClosed (server offline or unreachable)';
    }
    console.log(`[Bot Disconnected: ${name}]`, r);
});

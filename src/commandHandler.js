const Utils = require('./utils');
const { addChat } = require('./chat');
const { bodyguardSystem } = require('./bodyguard');
const { commandsPrinter } = require('./commandsPrinter');
const { placerPrinter } = require('./placerPrinter');
const { Movements } = require('mineflayer-pathfinder');

let memory = {};

function createCommandHandler(swarmManager) {
    return async function handleChat(username, message, bot, master, isWhisper = false) {
        console.log(`[Chat Received] <${username}> ${message} (whisper: ${isWhisper})`);

        // Check if sender is authorized master
        if (username === bot.username || !master.includes(username)) return;

        // If whisper and doesn't specify bot name, treat as addressed to this bot
        if (isWhisper && !message.startsWith(bot.username) && !message.startsWith('swarm')) {
            message = bot.username + ' ' + message;
        }

        const returnAddress = isWhisper ? username : null;
        const messageParts = message.trim().split(/\s+/);
        const messageFor = messageParts.shift();

        // Check if this message was addressed to this bot, or to swarm
        const isSwarm = messageFor === 'swarm';
        if (messageFor !== bot.username && !isSwarm) return;

        const cmd = (messageParts[0] || '').toLowerCase();
        const args = messageParts.slice(1);

        const targetPlayer = bot.players[username];
        const targetEntity = targetPlayer ? targetPlayer.entity : null;

        let mcData;
        try {
            mcData = require('minecraft-data')(bot.version);
        } catch (e) {}

        const defaultMove = mcData ? new Movements(bot, mcData) : null;
        if (defaultMove) {
            defaultMove.allowFreeMotion = true;
            defaultMove.allowParkour = true;
        }

        switch (cmd) {
            case 'status': {
                const hp = Math.floor(bot.health || 0);
                const food = Math.floor(bot.food || 0);
                const role = bot.role || 'general';
                const st = bot.state || 'idle';
                const sub = bot.substate || 'none';
                addChat(bot, `[${bot.username}] HP: ${hp} | Food: ${food} | Role: ${role} | State: ${st}(${sub})`, returnAddress);
                break;
            }

            case 'bots': {
                const all = swarmManager.getAllBots();
                const list = all.map(b => `${b.username} (${b.role || 'general'}: ${b.state || 'idle'})`).join(', ');
                addChat(bot, `Active Bots (${all.length}): ${list}`, returnAddress);
                break;
            }

            // ==========================================
            // BODYGUARD FUNCTIONALITY
            // ==========================================
            case 'bodyguard':
            case 'bodyguards':
            case 'selfguard': {
                const subCmd = (args[0] || '').toLowerCase();

                // Stop bodyguarding
                if (subCmd === 'stop') {
                    if (isSwarm) {
                        bodyguardSystem.stopGuards(swarmManager.getAllBots(), username);
                        addChat(bot, 'All bodyguards standing down.', returnAddress);
                    } else {
                        bodyguardSystem.stopGuards(bot, username);
                        addChat(bot, 'Standing down from bodyguard duty.', returnAddress);
                    }
                    break;
                }

                // Dismiss spawned bodyguard bots
                if (subCmd === 'dismiss') {
                    const prefix = args[1] || null;
                    const count = bodyguardSystem.dismissGuards(swarmManager, username, prefix);
                    addChat(bot, `Dismissed ${count} bodyguard bots.`, returnAddress);
                    break;
                }

                // Existing bots bodyguarding
                if (subCmd === 'existing') {
                    const botSelection = args[1] || (isSwarm ? 'all' : bot.username);
                    const bossName = args[2] || username;
                    const selectedBots = swarmManager.getBots(botSelection);

                    if (selectedBots.length === 0) {
                        addChat(bot, `No matching existing bots found for "${botSelection}".`, returnAddress);
                        return;
                    }

                    bodyguardSystem.addExistingGuards(selectedBots, bossName);
                    const names = selectedBots.map(b => b.username).join(', ');
                    addChat(bot, `Existing bots [${names}] are now bodyguarding ${bossName}!`, returnAddress);
                    break;
                }

                // New bots join the server and bodyguard
                if (subCmd === 'new' || (!isNaN(parseInt(subCmd, 10)) && subCmd !== '')) {
                    let count = 1;
                    let prefix = 'Guard';
                    let bossName = username;

                    if (subCmd === 'new') {
                        count = parseInt(args[1], 10) || 1;
                        prefix = args[2] || 'Guard';
                        bossName = args[3] || username;
                    } else {
                        count = parseInt(subCmd, 10) || 1;
                        if (cmd === 'selfguard') {
                            bossName = bot.username;
                            prefix = bot.username + 'Bot';
                        } else {
                            bossName = args[1] || username;
                            prefix = (args[2] || 'Guard');
                        }
                    }

                    addChat(bot, `Spawning ${count} new bodyguard bots for ${bossName}...`, returnAddress);
                    bodyguardSystem.spawnNewGuards(swarmManager, bossName, count, prefix)
                        .then((spawned) => {
                            addChat(bot, `${spawned.length} new bodyguard bots have arrived to protect ${bossName}!`, returnAddress);
                        })
                        .catch((err) => {
                            addChat(bot, `Error spawning bodyguards: ${err.message}`, returnAddress);
                        });
                    break;
                }

                // Default to making targeted bot(s) bodyguard the user
                const bossTarget = args[0] || username;
                if (isSwarm) {
                    const allBots = swarmManager.getAllBots();
                    bodyguardSystem.addExistingGuards(allBots, bossTarget);
                    addChat(bot, `All swarm bots are now bodyguarding ${bossTarget}!`, returnAddress);
                } else {
                    bodyguardSystem.addExistingGuards(bot, bossTarget);
                    addChat(bot, `I am now bodyguarding ${bossTarget}!`, returnAddress);
                }
                break;
            }

            case 'halt': {
                bodyguardSystem.haltGuards(username);
                const botsToStop = isSwarm ? swarmManager.getAllBots() : [bot];
                botsToStop.forEach(b => {
                    b.huntTargetName = null;
                    if (b.swordpvp && typeof b.swordpvp.stop === 'function') {
                        try { b.swordpvp.stop(); } catch {}
                    }
                    if (b.bowpvp && typeof b.bowpvp.stop === 'function') {
                        try { b.bowpvp.stop(); } catch {}
                    }
                    if (b.pvp && typeof b.pvp.stop === 'function') {
                        b.pvp.stop();
                    }
                    if (b.clearTargets) b.clearTargets();
                    if (b.pathfinder) b.pathfinder.setGoal(null);
                });
                addChat(bot, 'Combat halted.', returnAddress);
                break;
            }

            case 'sword':
            case 'melee':
            case 'bow':
            case 'shoot':
            case 'snipe':
            case 'attack':
            case 'kill':
            case 'target': {
                let mode = 'auto';
                let targetName = args[0];

                if (cmd === 'sword' || cmd === 'melee') {
                    mode = 'sword';
                } else if (cmd === 'bow' || cmd === 'shoot' || cmd === 'snipe') {
                    mode = 'bow';
                } else if (args[1] && ['sword', 'bow', 'auto'].includes(args[1].toLowerCase())) {
                    mode = args[1].toLowerCase();
                }

                if (!targetName) {
                    addChat(bot, `Who should I ${cmd}?`, returnAddress);
                    return;
                }

                const findTarget = (b) => {
                    if (typeof b.findEntityByName === 'function') return b.findEntityByName(targetName);
                    const p = b.players ? b.players[targetName] : null;
                    return p && p.entity ? p.entity : (typeof b.nearestEntity === 'function' ? b.nearestEntity(e => (e.name && e.name.toLowerCase() === targetName.toLowerCase()) || (e.username && e.username.toLowerCase() === targetName.toLowerCase())) : null);
                };

                const entityToAttack = findTarget(bot);
                const isBgCommand = message.toLowerCase().includes('bodyguard') || (isSwarm && bot.state === 'bodyguard');
                const guards = bodyguardSystem.getGuardsForBoss(username);

                if (isBgCommand && guards.length > 0) {
                    if (entityToAttack) {
                        bodyguardSystem.setTargetForGuards(username, entityToAttack);
                        addChat(bot, `Bodyguards targeting ${targetName}!`, returnAddress);
                    } else {
                        addChat(bot, `Target "${targetName}" not found nearby.`, returnAddress);
                    }
                } else {
                    const botsToOrder = isSwarm ? swarmManager.getAllBots() : [bot];
                    let attackedCount = 0;
                    botsToOrder.forEach(b => {
                        b.huntTargetName = targetName.toLowerCase().trim();
                        if (typeof b.ensureWeaponEquipped === 'function') b.ensureWeaponEquipped(); else if (b.equipForCombat) b.equipForCombat();
                        if (typeof b.attackPlayer === 'function') {
                            const ok = b.attackPlayer(targetName, mode);
                            if (ok) attackedCount++;
                        } else {
                            const ent = findTarget(b) || entityToAttack;
                            if (ent && ent.isValid) {
                                attackedCount++;
                                if (b.swordpvp && typeof b.swordpvp.attack === 'function' && mode === 'sword') {
                                    b.swordpvp.attack(ent);
                                } else if (b.bowpvp && typeof b.bowpvp.attack === 'function' && mode === 'bow') {
                                    b.bowpvp.attack(ent, 'bow');
                                } else if (b.swordpvp && typeof b.swordpvp.attack === 'function') {
                                    b.swordpvp.attack(ent);
                                } else if (b.pvp && typeof b.pvp.attack === 'function') {
                                    b.pvp.attack(ent);
                                } else if (typeof b.attack === 'function') {
                                    b.attack(ent);
                                }
                            }
                        }
                    });

                    if (attackedCount > 0) {
                        addChat(bot, `${isSwarm ? 'All bots' : 'Bot'} attacking ${targetName} (${mode}) until eliminated!`, returnAddress);
                    } else if (entityToAttack) {
                        addChat(bot, `Attacking ${targetName} (${mode})!`, returnAddress);
                    } else {
                        addChat(bot, `Hunting ${targetName} (will engage in ${mode} PvP on sight until eliminated)!`, returnAddress);
                    }
                }
                break;
            }

            case 'crit': {
                const critMode = (args[0] || '').toLowerCase();
                const botsToConfig = isSwarm ? swarmManager.getAllBots() : [bot];
                botsToConfig.forEach(b => {
                    if (b.swordpvp && b.swordpvp.options && b.swordpvp.options.critConfig) {
                        if (['hop', 'packet', 'shorthop'].includes(critMode)) {
                            b.swordpvp.options.critConfig.enabled = true;
                            b.swordpvp.options.critConfig.mode = critMode;
                        } else if (critMode === 'off') {
                            b.swordpvp.options.critConfig.enabled = false;
                        }
                    }
                });
                addChat(bot, `Critical hits set to: ${critMode}`, returnAddress);
                break;
            }

            case 'shield': {
                const shieldMode = (args[0] || '').toLowerCase();
                const botsToConfig = isSwarm ? swarmManager.getAllBots() : [bot];
                botsToConfig.forEach(b => {
                    if (b.swordpvp && b.swordpvp.options && b.swordpvp.options.shieldConfig) {
                        if (['legit', 'blatant'].includes(shieldMode)) {
                            b.swordpvp.options.shieldConfig.enabled = true;
                            b.swordpvp.options.shieldConfig.mode = shieldMode;
                        } else if (shieldMode === 'off') {
                            b.swordpvp.options.shieldConfig.enabled = false;
                        }
                    }
                });
                addChat(bot, `Shield mode set to: ${shieldMode}`, returnAddress);
                break;
            }

            case 'strafe': {
                const strafeMode = (args[0] || '').toLowerCase();
                const botsToConfig = isSwarm ? swarmManager.getAllBots() : [bot];
                botsToConfig.forEach(b => {
                    if (b.swordpvp && b.swordpvp.options && b.swordpvp.options.strafeConfig) {
                        if (['intelligent', 'circle', 'random'].includes(strafeMode)) {
                            b.swordpvp.options.strafeConfig.enabled = true;
                            b.swordpvp.options.strafeConfig.mode = { mode: strafeMode, maxOffset: Math.PI / 2 };
                        } else if (strafeMode === 'off') {
                            b.swordpvp.options.strafeConfig.enabled = false;
                        }
                    }
                });
                addChat(bot, `Strafe mode set to: ${strafeMode}`, returnAddress);
                break;
            }

            case 'wtap': {
                const tapArg = (args[0] || '').toLowerCase();
                const enabled = tapArg === 'on' || tapArg === 'true';
                const botsToConfig = isSwarm ? swarmManager.getAllBots() : [bot];
                botsToConfig.forEach(b => {
                    if (b.swordpvp && b.swordpvp.options && b.swordpvp.options.tapConfig) {
                        b.swordpvp.options.tapConfig.enabled = enabled;
                    }
                });
                addChat(bot, `W-tap ${enabled ? 'enabled' : 'disabled'}`, returnAddress);
                break;
            }

            // ==========================================
            // COMMANDS & PLACER PRINTER FUNCTIONALITY
            // ==========================================
            case 'print': {
                const printerType = (args[0] || '').toLowerCase();
                const modeOrFirst = (args[1] || '').toLowerCase();

                if (printerType === 'stop') {
                    commandsPrinter.stop();
                    placerPrinter.stop();
                    addChat(bot, 'Printing stopped.', returnAddress);
                    break;
                }

                // COMMANDS PRINTER
                if (printerType === 'command') {
                    if (modeOrFirst === 'existing') {
                        const botSelection = args[2] || (isSwarm ? 'all' : bot.username);
                        const coords = { x: args[3], y: args[4], z: args[5] };
                        const imageFile = args[6] || 'image.jpg';
                        const selectedBots = swarmManager.getBots(botSelection);

                        if (selectedBots.length === 0) {
                            addChat(bot, `No existing bots found matching "${botSelection}".`, returnAddress);
                            return;
                        }

                        addChat(bot, `Starting command print with existing bots [${selectedBots.map(b => b.username).join(', ')}]...`, returnAddress);
                        commandsPrinter.printWithBots(selectedBots, coords, imageFile, {
                            onStart: (info) => addChat(bot, `Commands printer generated ${info.totalCommands} blocks from ${imageFile}.`, returnAddress),
                            onComplete: () => addChat(bot, 'Commands printing complete!', returnAddress)
                        }).catch(err => addChat(bot, `Printing error: ${err.message}`, returnAddress));
                        break;
                    }

                    if (modeOrFirst === 'new') {
                        const count = parseInt(args[2], 10) || 1;
                        const prefix = args[3] || 'CmdPrinter';
                        const coords = { x: args[4], y: args[5], z: args[6] };
                        const imageFile = args[7] || 'image.jpg';

                        addChat(bot, `Spawning ${count} new bots to print commands...`, returnAddress);
                        commandsPrinter.printWithNewBots(swarmManager, count, prefix, coords, imageFile, {
                            onStart: (info) => addChat(bot, `Spawned bots ready. Printing ${info.totalCommands} blocks...`, returnAddress),
                            onComplete: () => addChat(bot, 'Commands printing complete with new bots!', returnAddress)
                        }).catch(err => addChat(bot, `Printing error: ${err.message}`, returnAddress));
                        break;
                    }

                    if (args.length >= 6 && !isNaN(parseInt(args[4], 10))) {
                        const coords = { x: args[1], y: args[2], z: args[3] };
                        const count = parseInt(args[4], 10) || 1;
                        const prefix = args[5] || 'CmdPrinter';
                        const imageFile = args[6] || 'image.jpg';

                        addChat(bot, `Spawning ${count} new bots for command printing...`, returnAddress);
                        commandsPrinter.printWithNewBots(swarmManager, count, prefix, coords, imageFile, {
                            onComplete: () => addChat(bot, 'Commands printing finished!', returnAddress)
                        }).catch(err => addChat(bot, `Printing error: ${err.message}`, returnAddress));
                        break;
                    }

                    const coords = { x: args[1], y: args[2], z: args[3] };
                    const imageFile = args[4] || 'image.jpg';
                    const botsToUse = isSwarm ? swarmManager.getAllBots() : [bot];

                    addChat(bot, `Printing commands using [${botsToUse.map(b => b.username).join(', ')}]...`, returnAddress);
                    commandsPrinter.printWithBots(botsToUse, coords, imageFile, {
                        onComplete: () => addChat(bot, 'Commands printing finished!', returnAddress)
                    }).catch(err => addChat(bot, `Printing error: ${err.message}`, returnAddress));
                    break;
                }

                // PLACER PRINTER
                if (printerType === 'placer') {
                    if (modeOrFirst === 'existing') {
                        const botSelection = args[2] || (isSwarm ? 'all' : bot.username);
                        const coords = { x: args[3], y: args[4], z: args[5] };
                        const imageFile = args[6] || 'image.jpg';
                        const palette = args[7] || 'concrete';
                        const size = args[8] || '32x32';
                        const selectedBots = swarmManager.getBots(botSelection);

                        if (selectedBots.length === 0) {
                            addChat(bot, `No existing bots found matching "${botSelection}".`, returnAddress);
                            return;
                        }

                        addChat(bot, `Starting placer print with existing bots [${selectedBots.map(b => b.username).join(', ')}]...`, returnAddress);
                        placerPrinter.printWithBots(selectedBots, coords, imageFile, {
                            palette,
                            size,
                            onStart: (info) => addChat(bot, `Placer printer placing ${info.totalBlocks} blocks (${info.width}x${info.height})...`, returnAddress),
                            onComplete: () => addChat(bot, 'Placer printing complete!', returnAddress)
                        }).catch(err => addChat(bot, `Placer print error: ${err.message}`, returnAddress));
                        break;
                    }

                    if (modeOrFirst === 'new') {
                        const count = parseInt(args[2], 10) || 1;
                        const prefix = args[3] || 'Placer';
                        const coords = { x: args[4], y: args[5], z: args[6] };
                        const imageFile = args[7] || 'image.jpg';
                        const palette = args[8] || 'concrete';
                        const size = args[9] || '32x32';

                        addChat(bot, `Spawning ${count} new bots to place blocks...`, returnAddress);
                        placerPrinter.printWithNewBots(swarmManager, count, prefix, coords, imageFile, {
                            palette,
                            size,
                            onComplete: () => addChat(bot, 'Placer printing complete with new bots!', returnAddress)
                        }).catch(err => addChat(bot, `Placer print error: ${err.message}`, returnAddress));
                        break;
                    }

                    const coords = { x: args[1], y: args[2], z: args[3] };
                    const imageFile = args[4] || 'image.jpg';
                    const palette = args[5] || 'concrete';
                    const size = args[6] || '32x32';
                    const botsToUse = isSwarm ? swarmManager.getAllBots() : [bot];

                    addChat(bot, `Placing blocks using [${botsToUse.map(b => b.username).join(', ')}]...`, returnAddress);
                    placerPrinter.printWithBots(botsToUse, coords, imageFile, {
                        palette,
                        size,
                        onComplete: () => addChat(bot, 'Placer printing complete!', returnAddress)
                    }).catch(err => addChat(bot, `Placer print error: ${err.message}`, returnAddress));
                    break;
                }

                addChat(bot, 'Unknown print type. Use "print command" or "print placer".', returnAddress);
                break;
            }

            // ==========================================
            // RESOURCE BOTS & AUTOMATION TASKS
            // ==========================================
            case 'hole': {
                Utils.hole(bot, args, defaultMove, (msg) => {
                    addChat(bot, msg, returnAddress);
                });
                break;
            }

            case 'nearby': {
                const nearby = Utils.nearbyBlocks(bot);
                addChat(bot, nearby.length > 0 ? `Nearby blocks: ${nearby.join(', ')}` : 'No exposed blocks found nearby.', returnAddress);
                break;
            }

            case 'equip': {
                if (!args[0]) {
                    addChat(bot, 'Usage: equip <itemName>', returnAddress);
                    return;
                }
                Utils.equipByName(bot, args[0], mcData, (msg) => {
                    addChat(bot, msg, returnAddress);
                });
                break;
            }

            case 'drop': {
                // Supports: drop <itemName> OR drop <amount> <itemName>
                if (args.length >= 2 && !isNaN(parseInt(args[0], 10))) {
                    const amount = parseInt(args[0], 10);
                    const itemName = args[1];
                    Utils.tossItem(bot, itemName, amount, username, (msg) => {
                        addChat(bot, msg, returnAddress);
                    });
                } else if (args[0]) {
                    Utils.tossItem(bot, args[0], null, username, (msg) => {
                        addChat(bot, msg, returnAddress);
                    });
                } else {
                    addChat(bot, 'Usage: drop [amount] <itemName>', returnAddress);
                }
                break;
            }

            case 'protect': {
                addChat(bot, "Protecting area against hostile mobs...", returnAddress);
                Utils.attackNearestMob(bot, defaultMove, (msg) => {
                    addChat(bot, msg, returnAddress);
                });
                break;
            }

            case 'guard': {
                if (!targetEntity) {
                    addChat(bot, "I can't see you to guard your position.", returnAddress);
                    return;
                }
                addChat(bot, "Guarding your location against monsters.", returnAddress);
                const guardPos = targetEntity.position.clone();

                const guardTick = () => {
                    if (bot.state !== 'guardArea') {
                        bot.removeListener('physicsTick', guardTick);
                        return;
                    }
                    if (bot.pvp && bot.pvp.target) return;

                    const hostileFilter = e => e.kind === 'Hostile mobs' && e.isValid && e.position.distanceTo(guardPos) < 16;
                    const mob = bot.nearestEntity(hostileFilter);
                    if (mob) {
                        const sword = bot.inventory.items().find(i => i.name.includes('sword'));
                        if (typeof bot.ensureWeaponEquipped === 'function') bot.ensureWeaponEquipped(); else if (sword) bot.equip(sword, 'hand').catch(() => {});
                        if (bot.pvp) bot.pvp.attack(mob);
                        else bot.attack(mob);
                    } else if (bot.entity.position.distanceTo(guardPos) > 3) {
                        Utils.goToTarget(bot, { position: guardPos }, defaultMove, 1);
                    }
                };

                bot.state = 'guardArea';
                bot.on('physicsTick', guardTick);
                break;
            }

            case 'move': {
                if (args.length < 3) {
                    addChat(bot, 'Usage: move <xOffset> <yOffset> <zOffset>', returnAddress);
                    return;
                }
                const dx = parseInt(args[0], 10) || 0;
                const dy = parseInt(args[1], 10) || 0;
                const dz = parseInt(args[2], 10) || 0;
                const dest = bot.entity.position.offset(dx, dy, dz);
                Utils.goToTarget(bot, { position: dest }, defaultMove, 0, (success) => {
                    addChat(bot, success ? `Moved by ${dx}, ${dy}, ${dz}.` : `Could not complete relative move.`, returnAddress);
                });
                break;
            }

            case 'learn': {
                if (!targetEntity) {
                    addChat(bot, "I can't see you to learn your actions.", returnAddress);
                    return;
                }
                Utils.learn(bot, targetEntity, () => {
                    addChat(bot, "Learning started. Place or break blocks near you.", returnAddress);
                });
                break;
            }

            case 'learnstop':
            case 'recite': {
                const instructions = Utils.finishLearn(bot);
                if (instructions.length === 0) {
                    addChat(bot, "No block actions recorded.", returnAddress);
                } else {
                    addChat(bot, `Recorded ${instructions.length} actions: ${instructions.slice(0, 5).join('; ')}`, returnAddress);
                }
                break;
            }

            case 'locate': {
                const targetName = args[0];
                if (!targetName) {
                    addChat(bot, 'Usage: locate <entityOrBlockName>', returnAddress);
                    return;
                }
                // Check entities first
                const entity = bot.nearestEntity(e => e.name === targetName || e.username === targetName || e.displayName === targetName);
                if (entity && entity.position) {
                    const p = entity.position.floored();
                    addChat(bot, `Found entity ${targetName} at ${p.x} / ${p.y} / ${p.z}.`, returnAddress);
                    return;
                }
                // Check blocks
                if (mcData && mcData.blocksByName[targetName] && bot.findBlocks) {
                    const blocks = bot.findBlocks({ matching: mcData.blocksByName[targetName].id, maxDistance: 64, count: 1 });
                    if (blocks.length > 0) {
                        addChat(bot, `Found ${targetName} at ${blocks[0].x} / ${blocks[0].y} / ${blocks[0].z}.`, returnAddress);
                        return;
                    }
                }
                addChat(bot, `Could not locate "${targetName}" nearby.`, returnAddress);
                break;
            }

            case 'remember': {
                if (args.length > 0) {
                    const text = args.join(' ');
                    memory[bot.username] = text;
                    addChat(bot, 'Saved to memory!', returnAddress);
                } else {
                    addChat(bot, 'Usage: remember <text>', returnAddress);
                }
                break;
            }

            case 'valueof': {
                const val = memory[bot.username];
                addChat(bot, val ? `Memory: ${val}` : 'Nothing stored in memory.', returnAddress);
                break;
            }

            // ==========================================
            // MOVEMENT & NAVIGATION
            // ==========================================
            case 'come': {
                if (!targetEntity) {
                    addChat(bot, "I can't see you.", returnAddress);
                    return;
                }
                Utils.goToTarget(bot, targetEntity, defaultMove, 0, (success) => {
                    addChat(bot, success ? 'Got there.' : "Can't get there.", returnAddress);
                });
                break;
            }

            case 'follow': {
                let followTarget = targetEntity;
                if (args.length > 0) {
                    const p = bot.players[args[0]];
                    if (p && p.entity) {
                        followTarget = p.entity;
                    } else {
                        addChat(bot, `No player named ${args[0]} nearby.`, returnAddress);
                        return;
                    }
                }
                if (!followTarget) {
                    addChat(bot, "I can't see the target to follow.", returnAddress);
                    return;
                }
                Utils.follow(bot, followTarget, defaultMove);
                addChat(bot, 'Following target.', returnAddress);
                break;
            }

            case 'goto':
            case 'go': {
                if (args.length >= 3) {
                    const x = parseInt(args[0], 10);
                    const y = parseInt(args[1], 10);
                    const z = parseInt(args[2], 10);
                    Utils.goToTarget(bot, { position: { x, y, z } }, defaultMove, 0, (success) => {
                        addChat(bot, success ? 'Reached destination.' : "Couldn't reach destination.", returnAddress);
                    });
                } else if (args[0] === 'home') {
                    const home = Utils.getHome(bot);
                    if (home) {
                        Utils.goToTarget(bot, { position: home }, defaultMove, 1, (success) => {
                            addChat(bot, success ? 'Back home!' : "Couldn't reach home.", returnAddress);
                        });
                    } else {
                        addChat(bot, "I haven't set a home location yet.", returnAddress);
                    }
                } else if (args[0]) {
                    const player = bot.players[args[0]];
                    if (player && player.entity) {
                        Utils.goToTarget(bot, player.entity, defaultMove, 1, (success) => {
                            addChat(bot, success ? `Arrived at ${args[0]}.` : `Couldn't reach ${args[0]}.`, returnAddress);
                        });
                    } else {
                        addChat(bot, `Can't find ${args[0]}.`, returnAddress);
                    }
                }
                break;
            }

            case 'sethome': {
                Utils.setHome(bot, bot.entity.position);
                addChat(bot, 'Home position saved!', returnAddress);
                break;
            }

            case 'stop': {
                Utils.stop(bot);
                bodyguardSystem.stopGuards(bot, username);
                commandsPrinter.stop();
                placerPrinter.stop();
                bot.state = 'idle';
                if (bot.swordpvp && typeof bot.swordpvp.stop === 'function') {
                    try { bot.swordpvp.stop(); } catch {}
                }
                if (bot.bowpvp && typeof bot.bowpvp.stop === 'function') {
                    try { bot.bowpvp.stop(); } catch {}
                }
                if (bot.clearTargets) bot.clearTargets();
                addChat(bot, 'Stopped all actions.', returnAddress);
                break;
            }

            // ==========================================
            // INVENTORY & CRAFTING
            // ==========================================
            case 'inventory': {
                addChat(bot, Utils.inventoryAsString(bot, bot.inventory.items()), returnAddress);
                break;
            }

            case 'harvest':
            case 'mine': {
                if (args.length < 2) {
                    addChat(bot, 'Usage: harvest <count> <blockName>', returnAddress);
                    return;
                }
                const count = parseInt(args[0], 10) || 1;
                const blockName = args[1];
                Utils.harvest(bot, blockName, defaultMove, count, mcData, (msg) => {
                    addChat(bot, msg, returnAddress);
                });
                break;
            }

            case 'find': {
                const name = args[0];
                if (!name || !mcData.blocksByName[name]) {
                    addChat(bot, `${name} is not a valid block name.`, returnAddress);
                    return;
                }
                const id = mcData.blocksByName[name].id;
                const blocks = bot.findBlocks({ matching: id, maxDistance: 64, count: 5 });
                addChat(bot, `Found ${blocks.length} ${name} blocks nearby.`, returnAddress);
                break;
            }

            case 'collect': {
                Utils.collectDrops(bot, defaultMove, 30, () => {
                    addChat(bot, 'Collected nearby drops.', returnAddress);
                });
                break;
            }

            case 'hunt': {
                const count = parseInt(args[0], 10) || 1;
                addChat(bot, `Hunting ${count} animals...`, returnAddress);
                Utils.hunt(bot, defaultMove, count, 30, () => {
                    addChat(bot, 'Finished hunting.', returnAddress);
                });
                break;
            }

            case 'craft': {
                const itemName = args[0];
                const amount = parseInt(args[1], 10) || 1;
                let table = bot.findBlockSync ? bot.findBlockSync({
                    matching: 'crafting_table',
                    point: bot.entity.position,
                    maxDistance: 16
                })[0] : null;

                Utils.craft(bot, itemName, mcData, amount, table, (err) => {
                    if (err) {
                        addChat(bot, `Crafting error: ${err}`, returnAddress);
                    } else {
                        addChat(bot, `Crafted ${amount}x ${itemName}!`, returnAddress);
                    }
                });
                break;
            }

            case 'info': {
                addChat(bot, Utils.info(bot, messageParts), returnAddress);
                break;
            }

            case 'say': {
                const msgToSend = args.join(' ');
                addChat(bot, msgToSend, null);
                break;
            }

            case 'use': {
                bot.activateItem();
                break;
            }

            case 'disuse': {
                bot.deactivateItem();
                break;
            }

            case 'leave':
            case 'quit': {
                swarmManager.removeBot(bot);
                break;
            }

            default:
                addChat(bot, `Unknown command: ${cmd}`, returnAddress);
                break;
        }
    };
}

module.exports = {
    createCommandHandler
};


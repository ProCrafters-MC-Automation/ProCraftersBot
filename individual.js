const Utils = require('./utils');
const Movements = require('mineflayer-pathfinder').Movements
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, goals } = require('mineflayer-pathfinder')
const { worker } = require('worker_threads');
let memory = {}

const movementCallback = (returnAddress, bot, chat, target, successful) => {
    const announcement = successful ? `got there` : `can't get there`;
    chat.addChat(bot, announcement, returnAddress);
}

let stopLearn = null;
const handleChat = (username, message, bot, master, chat, isWhisper = false) => {
    console.log(username, message);
    if (username === bot.username || !master.includes(username)) return;

    // insert bot name for whispers, if not present for easier parsing
    if (isWhisper && !message.startsWith(bot.username)) message = bot.username + ' ' + message;
    const returnAddress = isWhisper ? username : null; // used for direct response or global chat depending on how we were spoken to

    const messageParts = message.split(' ');
    let messageFor = messageParts.shift();
    if (messageFor != bot.username && messageFor != 'swarm') return;

    let target = bot.players[username].entity;
    const mcData = require('minecraft-data')(bot.version)
    const defaultMove = new Movements(bot, mcData);
    switch (messageParts[0]) {
        case 'status':
            chat.addChat(bot, 'HP: ' + bot.health.toString().split('.')[0] + ' | Food: ' + bot.food.toString().split('.')[0] + ' | ' + bot.state + '(' + bot.substate + ')', returnAddress)
            break;
        case 'target':
            const targetPlayer = bot.players[messageParts[1]]
            if (!targetPlayer) {
                chat.addChat(bot, "I can't see the target.", returnAddress)
                return
            }
            bot.pvp.attack(targetPlayer.entity)
            break;
        case 'come':
            Utils.goToTarget(bot, target, defaultMove, 0, (success) => {
                movementCallback(returnAddress, bot, chat, target, success);
            });
            break;
        case 'follow':
            if (messageParts.length > 1) {
                let player = bot.players[messageParts[1]]
                if (player) {
                    target = player.entity;
                } else {
                    chat.addChat(bot, "No-one is called " + messageParts[1], returnAddress);
                    return;
                }
            }
            Utils.follow(bot, target, defaultMove);
            chat.addChat(bot, 'ok', returnAddress);
            break;
        case 'stop':
            Utils.stop(bot);
            chat.addChat(bot, 'ok', returnAddress);
            break;
        case 'info':
            chat.addChat(bot, Utils.info(bot, messageParts), returnAddress);
            break;
        case 'print':
            if (messageParts[1] == 'placer') {
                new Worker('./printerPlacerWorker.js', {
                    workerData: {
                        address: process.argv[2],
                        port: process.argv[3],
                        x: messageParts[2],
                        y: messageParts[3],
                        z: messageParts[4],
                        imageFile: messageParts[5]
                    },
                });
            } else if (messageParts[1] == 'command') {
                new Worker('./printerCommandWorker.js', {
                    workerData: {
                        address: process.argv[2],
                        port: process.argv[3],
                        x: messageParts[2],
                        y: messageParts[3],
                        z: messageParts[4],
                        botCount: messageParts[5],
                        prefix: messageParts[6],
                        imageFile: messageParts[7]
                    },
                });
            }
            break;
        case 'inventory':
            chat.addChat(bot, Utils.inventoryAsString(bot, bot.inventory.items()), returnAddress);
            break;
        case 'drop':
            if (messageParts[1]) {
                const item = bot.inventory.items().find(item => item.name.toLowerCase().includes(messageParts[1]))
                if (item) {
                    bot.tossStack(item)
                    response = [1, `Dropping ${messageParts[1].toLowerCase()}.`]
                }
                else {
                    response = [2, 'Item not found.']
                }
            }
            break;
        case 'harvest':
        case 'mine':
            if (messageParts.length == 1) {
                chat.addChat(bot, "Harvest how much of what!?", returnAddress);
                return;
            }
            Utils.harvest(bot, messageParts[2], defaultMove, parseInt(messageParts[1], 10), mcData, (msg) => {
                chat.addChat(bot, msg, returnAddress);
            });
            break;
        case 'find':
            const name = messageParts[1]
            if (mcData.blocksByName[name] === undefined) {
                chat.addChat(bot, `${name} is not a block name`, returnAddress)
                return
            }
            const ids = [mcData.blocksByName[name].id]
            const startTime = performance.now()
            const blocks = bot.findBlocks({ matching: ids, maxDistance: 128, count: 10 })
            const time = (performance.now() - startTime).toFixed(2)
            chat.addChat(bot, `I found ${blocks.length} ${name} blocks in ${time} ms`, returnAddress)
            break;
        case 'collect':
            Utils.collectDrops(bot, defaultMove, 30, () => chat.addChat(bot, "Everything's collected", returnAddress));
            break;
        case 'hunt':
            chat.addChat(bot, "I'm off hunting", returnAddress);
            Utils.hunt(bot, defaultMove, parseInt(messageParts[1], 30), 30, () => {
                chat.addChat(bot, 'finished hunting', returnAddress);
            });
            break;
        case 'goto':
        case 'go':
            let goto = (messageParts) => {
                if (messageParts.length > 3) {
                    let x = parseInt(messageParts[1], 10);
                    let y = parseInt(messageParts[2], 10);
                    let z = parseInt(messageParts[3], 10);
                    Utils.goToTarget(bot, { position: { x, y, z } }, defaultMove, 0, (success) => {
                        movementCallback(returnAddress, bot, chat, target, success);
                    });
                } else {
                    let player = bot.players[messageParts[1]]
                    if (player) {
                        target = player.entity;
                    } else {
                        if (messageParts[1] == 'home') {
                            let homePos = Utils.getHome(bot);
                            if (homePos) {
                                target = { position: homePos };
                            } else {
                                chat.addChat(bot, "I'm homeless, I've got no home to go to", returnAddress);
                                return;
                            }
                        } else {
                            chat.addChat(bot, "No-one is called " + messageParts[1], returnAddress);
                            return;
                        }
                    }
                    Utils.goToTarget(bot, target, defaultMove, 1, (success) => {
                        movementCallback(returnAddress, bot, chat, target, success);
                    });
                }
            };
            goto(messageParts);
            break;
        case 'learn':
            Utils.learn(bot, target, console.log);
            break;
        case 'learnStop':
            Utils.finishLearn(bot);
            break;
        case 'craft':
            let itemName = messageParts[1];
            let amount = messageParts.length > 2 ? parseInt(messageParts[2]) : 1;
            let craftingTableBlockInfo = Utils.nameToBlock('crafting_table', mcData);

            let craftingTable = bot.findBlockSync({
                matching: craftingTableBlockInfo.id,
                point: bot.entity.position
            })[0];

            Utils.goToTarget(bot, craftingTable, defaultMove, 2, (arrivedSuccessfully) => {
                if (!arrivedSuccessfully) return chat.addChat(bot, `Couldn't get to the crafting table`, returnAddress);
                Utils.craft(bot, itemName, mcData, amount, craftingTable, (err) => {
                    if (err) {
                        chat.addChat(bot, `Couldn't make a ${itemName}`, returnAddress);
                        console.log(err);
                    } else {
                        chat.addChat(bot, `Made the ${itemName}`, returnAddress);
                    }
                });
            });
            break;
        case 'setHome':
            Utils.setHome(bot, bot.entity.position);
            chat.addChat(bot, "Homely!", returnAddress);
            break;
        case 'say':
            messageParts.shift();
            const msgToSend = messageParts.join(' ');
            chat.addChat(bot, `Ok I'll say "${msgToSend}"`, username);
            console.log('repeat', msgToSend);
            chat.addChat(bot, msgToSend, null);
            break;
        case 'use':
            bot.activateItem();
            break;
        case 'disuse':
            bot.deactivateItem();
            break;
        case 'leave':
            process.exit(0);
        case 'locate':
            if (messageParts[1]) {
                var position = null
                const filter = e => e.username === messageParts[1] || e.name === messageParts[1]
                const entity = bot.nearestEntity(filter)
                if (entity) {
                    position = entity.position
                }
                else {
                    chat.addChat(bot, Utils.nearbyBlocks(bot).join(', '), returnAddress);
                }
                if (position) {
                    position.x = parseInt(position.x.toString().split('.')[0])
                    position.y = parseInt(position.y.toString().split('.')[0])
                    position.z = parseInt(position.z.toString().split('.')[0])
                    chat.addChat(bot, 'Found at ' + position.x.toString() + ' / ' + position.y.toString() + ' / ' + position.z.toString() + '.', returnAddress)
                }
                else {
                    chat.addChat(bot, 'Could not locate entity/block.', returnAddress)
                }
            }
            break;
        case 'remember':
            if (messageParts[2]) {
                memory[bot.username] = message.slice(2, message.length);
                chat.addChat(bot, 'Successfully saved!', returnAddress);
            }
            break;
        case 'valueof':
            chat.addChat(bot, JSON.stringify(memory), returnAddress);
            break;
        case 'guard':
            bot.on('playerCollect', (collector, itemDrop) => {
                if (collector !== bot.entity) return

                setTimeout(() => {
                    const sword = bot.inventory.items().find(item => item.name.includes('sword'))
                    if (sword) bot.equip(sword, 'hand')
                }, 150)
            })

            bot.on('playerCollect', (collector, itemDrop) => {
                if (collector !== bot.entity) return

                setTimeout(() => {
                    const shield = bot.inventory.items().find(item => item.name.includes('shield'))
                    if (shield) bot.equip(shield, 'off-hand')
                }, 250)
            })

            let guardPos = null

            function guardArea(pos) {
                guardPos = pos.clone()
                console.log(pos)
                console.log(guardPos)
                if (!bot.pvp.target) {
                    moveToGuardPos()
                }
            }

            function stopGuarding() {
                guardPos = null
                bot.pvp.stop()
                bot.pathfinder.setGoal(null)
            }

            function moveToGuardPos() {
                const mcData = require('minecraft-data')(bot.version)
                bot.pathfinder.setMovements(new Movements(bot, mcData))
                bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
            }

            bot.on('stoppedAttacking', () => {
                if (guardPos) {
                    moveToGuardPos()
                }
            })

            bot.on('physicTick', () => {
                if (bot.pvp.target) return
                if (bot.pathfinder.isMoving()) return
                const entity = bot.nearestEntity()
                if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0))
            })

            bot.on('physicTick', () => {
                if (!guardPos) return
                const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16 && e.mobType !== 'Armor Stand'
                const entity = bot.nearestEntity(filter)
                if (entity) {
                    const sword = bot.inventory.items().find(item => item.name.includes('sword'))
                    if (sword) bot.equip(sword, 'hand')
                    bot.pvp.attack(entity)
                }
            })

            const player = bot.players[username]

            if (!player) {
                chat.addChat(bot, "I can't see you.", returnAddress)
                return
            }

            chat.addChat(bot, 'I will guard that location.', returnAddress)
            guardArea(player.entity.position)
            break;
        case 'bodyguard':
            bot.state = "bodyguard"
            break;
        case 'bodyguards':
            let bossBodyguards = 0;
            if (messageParts[1] == null) {
                bossBodyguards = 1
            } else {
                bossBodyguards = messageParts[1]
            }
            new Worker('./bodyguards.js', {
                workerData: {
                    bossName: process.argv[5],
                    address: process.argv[2],
                    port: process.argv[3],
                    botCount: bossBodyguards,
                    prefix: bot.username + 'Boss'
                },
            });
            chat.addChat(bot, "Bodyguards are on their way", returnAddress)
            break;
        case 'selfguard':
            let selfBodyguards = 0;
            if (messageParts[1] == null) {
                selfBodyguards = 1
            } else {
                selfBodyguards = messageParts[1]
            }
            new Worker('./bodyguards.js', {
                workerData: {
                    bossName: bot.username,
                    address: process.argv[2],
                    port: process.argv[3],
                    botCount: selfBodyguards,
                    prefix: bot.username + 'Bot'
                },
            });
            chat.addChat(bot, "Bodyguards are on their way", returnAddress)
            break;
        default:
            chat.addChat(bot, 'I don\'t understand', returnAddress);
            return;
    }
};


var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/ultimateDebug.txt', { flags: 'w' });
var log_stdout = process.stdout;

console.log = function (d) { //
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};
console.error = console.log;

module.exports = {
    handleChat
};
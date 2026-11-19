const { GoalNear, GoalFollow } = require('mineflayer-pathfinder').goals;

const toolMaterials = ['netherite', 'diamond', 'iron', 'golden', 'stone', 'wooden'];

const behaviours = {
    hunt: (bot, movement, amount, maxDist = 30, cb = null) => {
        const mobs = Object.values(bot.entities)
            .filter(entity => entity.kind === 'Passive mobs')
            .filter(mob => !['squid', 'horse', 'salmon', 'wolf', 'bat'].includes(mob.name))
            .filter(mob => mob.position && mob.position.distanceTo(bot.entity.position) < maxDist)
            .sort((mobA, mobB) => mobA.position.distanceTo(bot.entity.position) - mobB.position.distanceTo(bot.entity.position))
            .slice(0, amount);
        behaviours.kill(bot, movement, mobs, cb);
    },

    kill: (bot, movement, mobs, cb) => {
        if (!mobs || mobs.length === 0) return cb ? cb() : null;
        const tool = behaviours.bestToolOfTypeInInv(bot, 'sword', toolMaterials);
        if (tool) {
            bot.equip(tool, 'hand').catch(() => {});
        }
        const mob = mobs.shift();
        if (!mob || !mob.isValid) {
            return behaviours.kill(bot, movement, mobs, cb);
        }

        bot.lookAt(mob.position);
        behaviours.follow(bot, mob, movement);

        let attackInterval = setInterval(() => {
            if (mob && mob.isValid) {
                bot.attack(mob);
            } else {
                clearInterval(attackInterval);
                behaviours.collectDrops(bot, movement, 10, () => {
                    behaviours.kill(bot, movement, mobs, cb);
                });
            }
        }, 300);
    },

    collectDrops: (bot, movement, maxDist, cb) => {
        const drops = Object.values(bot.entities)
            .filter(entity => entity.kind === 'Drops')
            .filter(drop => drop.position && drop.position.distanceTo(bot.entity.position) < maxDist)
            .sort((a, b) => a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position));

        if (drops.length === 0) {
            if (cb) cb();
            return;
        }

        behaviours.goToTarget(bot, drops.shift(), movement, 0, () => {
            behaviours.collectDrops(bot, movement, maxDist, cb);
        });
    },

    harvest: (bot, blockName, movement, amount, mcData, cb) => {
        if (amount <= 0) return cb ? cb(`I collected all the ${blockName} you asked for`) : null;

        const lookupBlock = behaviours.nameToBlock(blockName, mcData);
        if (!lookupBlock) return cb ? cb(`What's a ${blockName}?`) : null;
        const id = lookupBlock.id;

        const blocks = bot.findBlocks ? bot.findBlocks({
            matching: id,
            maxDistance: 32,
            count: 1
        }) : [];

        if (blocks.length === 0) {
            return cb ? cb(`Can't see any more ${blockName} nearby`) : null;
        }

        const blockPos = blocks[0];
        const block = bot.blockAt(blockPos);
        if (!block) return cb ? cb(`Could not reach ${blockName}`) : null;

        bot.lookAt(block.position);
        behaviours.goToTarget(bot, block, movement, 2, (arrived) => {
            if (!arrived) return cb ? cb(`Could not reach ${blockName}`) : null;
            behaviours.digBlockAt(bot, block.position, () => {
                behaviours.collectDrops(bot, movement, 5, () => {
                    behaviours.harvest(bot, blockName, movement, --amount, mcData, cb);
                });
            });
        });
    },

    inventoryItemByName: (bot, name) => {
        return bot.inventory.items().find(item => item.name === name);
    },

    nearbyBlocks: (bot, maxDist = 16) => {
        const counts = {};
        if (!bot.entity) return counts;
        for (let y = -maxDist; y <= maxDist; y++) {
            for (let x = -maxDist; x <= maxDist; x++) {
                for (let z = -maxDist; z <= maxDist; z++) {
                    const block = bot.blockAt(bot.entity.position.offset(x, y, z));
                    if (!block || block.name === 'air' || block.name === 'cave_air') continue;
                    counts[block.name] = (counts[block.name] || 0) + 1;
                }
            }
        }
        return counts;
    },

    nameToItem: (bot, name, mcData) => {
        return mcData && mcData.itemsByName ? mcData.itemsByName[name] : null;
    },

    nameToBlock: (name, mcData) => {
        return mcData && mcData.blocksByName ? mcData.blocksByName[name] : null;
    },

    inventoryAsString: (bot, items) => {
        if (!items || items.length === 0) return 'nothing';
        return items.map(behaviours.itemToString).join(', ');
    },

    itemToString: (item) => {
        return item ? `${item.name} x ${item.count}` : '(nothing)';
    },

    bestTool: (bot, block) => {
        if (bot.pathfinder && typeof bot.pathfinder.bestHarvestTool === 'function') {
            return bot.pathfinder.bestHarvestTool(block);
        }
        return null;
    },

    bestToolOfTypeInInv: (bot, toolname, materials) => {
        const tools = materials.map(x => `${x}_${toolname}`);
        for (const tool of tools) {
            const match = bot.inventory.items().find(item => item.name === tool);
            if (match) return match;
        }
        return null;
    },

    digBlockAt: (bot, position, onComplete) => {
        const target = bot.blockAt(position);
        if (!target || !bot.canDigBlock(target) || target.name === 'air') {
            if (onComplete) onComplete();
            return;
        }

        bot.lookAt(target.position);
        bot.dig(target, (err) => {
            if (err) console.error('[Dig Error]', err.message);
            if (onComplete) onComplete();
        });
    },

    hole: (bot, wOrParts, lOrDefaultMove, dOrCb, moveOrCb, cb) => {
        let width = 5, length = 5, depth = 3;
        let defaultMove = null;
        let callback = null;

        if (Array.isArray(wOrParts)) {
            const dim = (wOrParts[1] || '5x5x3').split('x').map(n => parseInt(n, 10));
            width = dim[0] || 5;
            length = dim[1] || 5;
            depth = dim[2] || 3;
            defaultMove = lOrDefaultMove;
            callback = dOrCb;
        } else if (typeof wOrParts === 'string' && wOrParts.includes('x')) {
            const dim = wOrParts.split('x').map(n => parseInt(n, 10));
            width = dim[0] || 5;
            length = dim[1] || 5;
            depth = dim[2] || 3;
            defaultMove = lOrDefaultMove;
            callback = dOrCb;
        } else {
            width = parseInt(wOrParts, 10) || 5;
            length = parseInt(lOrDefaultMove, 10) || 5;
            depth = parseInt(dOrCb, 10) || 3;
            defaultMove = moveOrCb;
            callback = cb;
        }

        const center = bot.entity ? bot.entity.position : { x: 0, y: 64, z: 0, offset: (x, y, z) => ({ x, y, z }) };
        const halfX = Math.floor(width / 2);
        const halfZ = Math.floor(length / 2);
        const positions = [];

        for (let yO = 0; yO >= -depth; yO--) {
            for (let xO = -halfX; xO <= halfX; xO++) {
                for (let zO = -halfZ; zO <= halfZ; zO++) {
                    positions.push(center.offset(xO, yO, zO));
                }
            }
        }

        behaviours.digBlocksInOrder(bot, positions, () => {
            if (callback) callback('Finished digging hole');
        }, defaultMove);
    },

    digBlocksInOrder: (bot, positions, onComplete, defaultMove) => {
        if (!positions || positions.length === 0) return onComplete ? onComplete() : null;
        const nextPosition = positions.shift();
        behaviours.goToTarget(bot, { position: nextPosition }, defaultMove, 4.5, () => {
            behaviours.digBlockAt(bot, nextPosition, () => {
                behaviours.digBlocksInOrder(bot, positions, onComplete, defaultMove);
            });
        });
    },

    tossItem: async (bot, name, amount = null, targetPlayer = null, cb = null) => {
        const item = bot.inventory.items().find(i => i.name.toLowerCase().includes(name.toLowerCase()));
        if (!item) {
            if (cb) cb(false, `No ${name} in inventory`);
            return false;
        }
        try {
            if (targetPlayer && targetPlayer.entity) {
                bot.lookAt(targetPlayer.entity.position.offset(0, targetPlayer.entity.height, 0));
            }
            const count = amount ? Math.min(amount, item.count) : item.count;
            await bot.toss(item.type, null, count);
            if (cb) cb(true, `Tossed ${count}x ${item.name}`);
            return true;
        } catch (err) {
            if (cb) cb(false, err.message);
            return false;
        }
    },

    equipByName: async (bot, name, destination = 'hand') => {
        const item = bot.inventory.items().find(i => i.name.toLowerCase().includes(name.toLowerCase()));
        if (!item) return false;
        try {
            await bot.equip(item, destination);
            return true;
        } catch {
            return false;
        }
    },

    attackNearestMob: (bot, movement, maxRange = 16, cb = null) => {
        const hostiles = Object.values(bot.entities)
            .filter(e => e.kind === 'Hostile mobs' && e.isValid && e.position)
            .sort((a, b) => a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position));

        if (hostiles.length > 0 && hostiles[0].position.distanceTo(bot.entity.position) <= maxRange) {
            behaviours.kill(bot, movement, [hostiles[0]], () => {
                if (cb) cb('Defeated hostile mob');
            });
        } else if (cb) {
            cb('No nearby hostile mobs found');
        }
    },

    protectFriendly: (self, other, movement, maxRange = 30) => {
        if (!other) return;
        const targetPos = other.position || (other.entity ? other.entity.position : null);
        if (!targetPos) return;

        if (self.entity && self.entity.position.distanceTo(targetPos) < maxRange) {
            behaviours.goToTarget(self, { position: targetPos }, movement, 3, () => {
                behaviours.attackNearestMob(self, movement);
            });
        }
    },

    guardArea: (bot, guardPos, movement) => {
        if (!guardPos) return;
        bot.state = 'guardArea';
        const guardTick = () => {
            if (bot.state !== 'guardArea') {
                bot.removeListener('physicsTick', guardTick);
                return;
            }
            if (bot.pvp && bot.pvp.target) return;

            const hostileFilter = e => e.kind === 'Hostile mobs' && e.isValid && e.position && e.position.distanceTo(guardPos) < 16;
            const mob = bot.nearestEntity(hostileFilter);
            if (mob) {
                const sword = bot.inventory.items().find(i => i.name.includes('sword'));
                if (sword) bot.equip(sword, 'hand').catch(() => {});
                if (bot.pvp) bot.pvp.attack(mob);
                else bot.attack(mob);
            } else if (bot.entity && bot.entity.position.distanceTo(guardPos) > 3) {
                behaviours.goToTarget(bot, { position: guardPos }, movement, 1);
            }
        };
        bot.on('physicsTick', guardTick);
    },

    learn: (bot, targetPlayer, done = null) => {
        if (!targetPlayer || !targetPlayer.entity) return;
        bot.isLearning = true;
        bot._learnInstructions = [];
        const initialLoc = targetPlayer.entity.position.floored();

        bot._learnListener = (oldBlock, newBlock) => {
            if (!newBlock || !bot.isLearning) return;
            if (targetPlayer.entity && targetPlayer.entity.position.floored().distanceTo(newBlock.position.floored()) < 8) {
                const isEmpty = newBlock.boundingBox === 'empty' || newBlock.name === 'air';
                const action = isEmpty ? 'dig' : 'place';
                const delta = newBlock.position.floored().minus(initialLoc);
                bot._learnInstructions.push(`${action} ${delta.x} ${delta.y} ${delta.z}`);
            }
        };

        bot.on('blockUpdate', bot._learnListener);
        if (done) bot._learnDone = done;
    },

    finishLearn: (bot) => {
        bot.isLearning = false;
        if (bot._learnListener) {
            bot.removeListener('blockUpdate', bot._learnListener);
            bot._learnListener = null;
        }
        const inst = bot._learnInstructions || [];
        if (bot._learnDone) {
            bot._learnDone(inst);
            bot._learnDone = null;
        }
        bot._learnInstructions = null;
        return inst;
    },

    info: (bot, messageParts) => {
        const playerName = messageParts[1];
        const player = bot.players[playerName];
        if (player && player.entity) {
            return `Info about ${playerName}:\nPos: ${player.entity.position}\nVel: ${player.entity.velocity}`;
        } else if (player) {
            return `${playerName} is in game, but not in visual range.`;
        }
        return `No player found called ${playerName}`;
    },

    stop: (bot) => {
        if (bot.stopMoving) bot.stopMoving();
        if (bot.stopMining) bot.stopMining();
        if (bot.clearTargets) bot.clearTargets();
        if (bot.pathfinder) bot.pathfinder.setGoal(null);
        bot.state = 'idle';
        bot.substate = 'none';
    },

    follow: (bot, target, movement) => {
        if (!target) return;
        bot.pathfinder.setMovements(movement);
        bot.pathfinder.setGoal(new GoalFollow(target, 3), true);
    },

    goToTarget: (bot, target, movement, dist = 0, cb) => {
        if (!target) {
            if (cb) cb(false);
            return;
        }
        const p = target.position;
        if (!p) {
            if (cb) cb(false);
            return;
        }

        bot.pathfinder.setMovements(movement);
        const goal = new GoalNear(p.x, p.y, p.z, dist);
        bot.pathfinder.setGoal(goal);

        let timeout = setTimeout(() => {
            clearInterval(check);
            if (cb) cb(false);
        }, 15000);

        let check = setInterval(() => {
            if (bot.entity && bot.entity.position.distanceTo(p) <= (dist + 1.5)) {
                clearTimeout(timeout);
                clearInterval(check);
                if (cb) cb(true);
            }
        }, 500);
    },

    craft: (bot, itemName, mcData, amount = 1, craftingTable = null, craftComplete = null) => {
        const item = behaviours.nameToItem(bot, itemName, mcData);
        if (!item) return craftComplete ? craftComplete(`Unknown item ${itemName}`) : null;
        const recipes = bot.recipesFor(item.id, null, amount, craftingTable);
        if (!recipes || recipes.length === 0) return craftComplete ? craftComplete(`No recipes found for ${itemName}`) : null;
        bot.craft(recipes[0], amount, craftingTable, craftComplete);
    },

    setHome: (bot, position) => {
        bot.homePosition = position.clone();
    },

    getHome: (bot) => {
        return bot.homePosition || null;
    }
};

module.exports = behaviours;

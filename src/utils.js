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
        const nearbyBlocks = {};
        for (let y = -maxDist; y <= maxDist; y++) {
            for (let x = -maxDist; x <= maxDist; x++) {
                for (let z = -maxDist; z <= maxDist; z++) {
                    const block = bot.blockAt(bot.entity.position.offset(x, y, z));
                    if (!block || block.name === 'air' || block.name === 'cave_air') continue;
                    nearbyBlocks[block.name] = (nearbyBlocks[block.name] || 0) + 1;
                }
            }
        }
        return Object.entries(nearbyBlocks)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => `${name}x${count}`);
    },

    nameToItem: (bot, name, mcData) => {
        return mcData.itemsByName ? mcData.itemsByName[name] : null;
    },

    nameToBlock: (name, mcData) => {
        return mcData.blocksByName ? mcData.blocksByName[name] : null;
    },

    inventoryAsString: (bot, items) => {
        if (!items || items.length === 0) return 'nothing';
        return items.map(behaviours.itemToString).join(', ');
    },

    itemToString: (item) => {
        return item ? `${item.name} x ${item.count}` : '(nothing)';
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
            if (bot.entity.position.distanceTo(p) <= (dist + 1.5)) {
                clearTimeout(timeout);
                clearInterval(check);
                if (cb) cb(true);
            }
        }, 500);
    },

    craft: (bot, itemName, mcData, amount = 1, craftingTable = null, craftComplete) => {
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

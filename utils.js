const { GoalNear, GoalFollow, Movements, goals } = require('mineflayer-pathfinder').goals
let mcData;
const toolMaterials = ['wooden', 'stone', 'iron', 'diamond', 'netherite', 'golden'];
const mineflayer = require('mineflayer');
const colorMap = require("./colorMap.json");
const getNearestBlockByColor = require('nearest-color').from(colorMap);
const Jimp = require("jimp");
const mcfsd = require("mcfsd");
const stuffs = require("stuffs");
const chillout = require("chillout");
const PathFinder = require("mineflayer-pathfinder");
const MinecraftData = require("minecraft-data");
const MinecraftItem = require('prismarine-item');
const { Vec3 } = require("vec3");

/** @type {typeof MinecraftItem.Item} */
let Item;

const behaviours = {
    hunt: (bot, movement, amount, maxDist = 30, cb = null) => {
        const mobs = Object.values(bot.entities)
            .filter(entity => entity.kind === 'Passive mobs')
            .filter(mob => !['squid', 'horse', 'salmon', 'wolf', 'bat'].includes(mob.name))
            .filter(mob => mob.position.distanceTo(bot.entity.position) < maxDist)
            .sort((mobA, mobB) => {
                return (mobA.position.distanceTo(bot.entity.position) - mobB.position.distanceTo(bot.entity.position));
            }).slice(0, amount);
        behaviours.kill(bot, movement, mobs, cb);
    },

    kill: (bot, movement, mobs, cb) => {
        if (mobs.length == 0) return cb ? cb() : null;
        const tool = behaviours.bestToolOfTypeInInv(bot, 'sword', toolMaterials);
        if (tool) {
            bot.equip(tool, 'hand');
        }
        const mob = mobs.shift();

        bot.lookAt(mob.position);

        behaviours.follow(bot, mob, movement);
        const attackLoop = () => {
            if (mob.isValid) {
                bot.attack(mob);
                setTimeout(attackLoop, 100);
            } else {
                behaviours.collectDrops(bot, movement, 10, () => {
                    setImmediate(behaviours.kill.bind(this, bot, movement, mobs, cb));
                });
            }
        }
        attackLoop();
    },

    collectDrops: (bot, movement, maxDist, cb) => {
        drops = Object.values(bot.entities)
            .filter(entity => entity.kind === 'Drops')
            .filter(drop => drop.position.distanceTo(bot.entity.position) < maxDist)
            .sort((dropA, dropB) => {
                return (dropA.position.distanceTo(bot.entity.position) - dropB.position.distanceTo(bot.entity.position));
            });
        if (drops.length == 0) {
            cb();
            return;
        }
        behaviours.goToTarget(bot, drops.shift(), movement, 0, () => {
            setImmediate(behaviours.collectDrops.bind(this, bot, movement, maxDist, cb));
        });
    },

    harvest: (bot, blockName, movement, amount, mcData, cb) => {
        if (amount <= 0) return cb ? cb(`I collected all the ${blockName} you asked for`) : null;

        const lookupBlock = behaviours.nameToBlock(blockName, mcData);
        if (!lookupBlock) return cb ? cb(`What's a ${blockName}?`) : null;
        const id = lookupBlock.id;

        let block = bot.findBlockSync({
            matching: id,
            point: bot.entity.position,
            maxDistance: 30
        })[0];

        if (!block) {
            return cb ? cb(`Can't see any more ${blockName} nearby`) : null;
        } else {
            bot.lookAt(block.position);
            behaviours.goToTarget(bot, block, movement, 1, () => {
                behaviours.digBlockAt(bot, block.position, () => {
                    behaviours.collectDrops(bot, movement, 5, () => {
                        setImmediate(behaviours.harvest.bind(this, bot, blockName, movement, --amount, mcData, cb));
                    });
                });
            });
        }
    },

    inventoryItemByName: (bot, name) => {
        return bot.inventory.items().filter(item => item.name === name)[0];
    },

    nearbyBlocks: (bot, maxDist = 30) => {
        let nearbyBlocks = {};
        for (let y = maxDist * -1; y <= maxDist; y++) {
            for (let x = maxDist * -1; x <= maxDist; x++) {
                for (let z = maxDist * -1; z <= maxDist; z++) {
                    let block = bot.blockAt(bot.entity.position.offset(x, y, z));

                    if (bot.blockAt(block.position.offset(0, 1, 0)).name != 'air') continue;
                    if (block.name == 'air' || block.name == 'cave_air') continue;
                    nearbyBlocks[block.name] = nearbyBlocks[block.name] ? nearbyBlocks[block.name] + 1 : 1;
                }
            }
        }
        let names = Object.keys(nearbyBlocks);
        let amounts = Object.values(nearbyBlocks);
        const result = names.map((name, index) => {
            return { name, amount: amounts[index] }
        }).sort((x, y) => y.amount - x.amount).map(x => `${x.name}x${x.amount}`);
        return result;
    },

    itemByNameIndex: (bot) => {
        let itemsByName
        if (bot.supportFeature('itemsAreNotBlocks')) {
            itemsByName = 'itemsByName'
        } else if (bot.supportFeature('itemsAreAlsoBlocks')) {
            itemsByName = 'blocksByName'
        }
        return itemsByName;
    },

    nameToItem: (bot, name, mcData) => {
        return mcData[behaviours.itemByNameIndex(bot)][name]
    },

    nameToBlock: (name, mcData) => {
        return mcData.blocksByName[name]
    },

    equipByName: (bot, name, mcData, cb) => {
        const item = mcData[behaviours.itemByNameIndex(bot)][name];
        if (!item) return cb(`Equip a ${name}? What do you mean?`);

        bot.equip(item.id, 'hand', (err) => {
            if (err) {
                return cb(`unable to equip ${name}, ${err.message}`);
            } else {
                return cb(`ok, got ${name}`);
            }
        });
    },

    inventoryAsString: (bot, items) => {
        const output = items.map(behaviours.itemToString).join(', ')
        return output ? output : 'nothing';
    },

    itemToString: (item) => {
        if (item) {
            return `${item.name} x ${item.count}`
        } else {
            return '(nothing)'
        }
    },

    hole: (bot, messageParts, defaultMove, cb) => {
        if (messageParts.length < 2) {
            cb("How big though?");
            return;
        }
        // width, length, depth
        const size = messageParts[1].split('x');
        cb(size[0] + " along x, " + size[1] + " along z and " + size[2] + " deep - got it!");
        let offsets = {
            x: Math.floor(Number(size[0]) / 2),
            z: Math.floor(Number(size[1]) / 2),
            y: Math.floor(Number(size[2]))
        }
        const center = bot.entity.position;
        const positions = [];
        for (let yO = 0; yO >= offsets.y * -1; yO--) {
            for (let xO = offsets.x * -1; xO <= offsets.x; xO++) {
                for (let zO = offsets.z * -1; zO <= offsets.z; zO++) {
                    positions.push(center.offset(xO, yO, zO));
                }
            }
        }

        behaviours.digBlocksInOrder(bot, positions, () => cb("Finished my hole :)"), defaultMove);
    },

    visitInOrder: (bot, positions, onComplete, defaultMove) => {
        if (positions == null || positions == undefined || positions.length == 0) return onComplete ? onComplete() : null;

        const nextPosition = positions.shift();
        behaviours.goToTarget(bot, { position: nextPosition }, defaultMove, 0, () => {
            setImmediate(behaviours.visitInOrder.bind(this, bot, positions, onComplete, defaultMove));
        });
    },

    digBlocksInOrder: (bot, positions, onComplete, defaultMove) => {
        if (positions == null || positions == undefined || positions.length == 0) return onComplete ? onComplete() : null;

        const nextPosition = positions.shift();
        behaviours.goToTarget(bot, { position: nextPosition }, defaultMove, 5, () => {
            behaviours.digBlockAt(bot, nextPosition, behaviours.digBlocksInOrder.bind(this, bot, positions, onComplete, defaultMove));
        });
    },

    bestTool: (bot, block) => {
        let tool = bot.pathfinder.bestHarvestTool(block);
        return tool;
    },

    bestToolOfTypeInInv: (bot, toolname, materials) => {
        const tools = materials.map(x => x + '_' + toolname);
        for (let i = tools.length - 1; i >= 0; i--) {
            const tool = tools[i];
            let matches = bot.inventory.items().filter(item => item.name === tool);
            if (matches.length > 0) return matches[0];
        }
        return null;
    },

    digBlockAt: (bot, position, onComplete) => {
        var target = bot.blockAt(position);
        bot.lookAt(target.position);
        const tool = behaviours.bestTool(bot, target);

        bot.equip(tool, 'hand', () => {
            if (target && bot.canDigBlock(target) && target.name != 'air') {
                bot.dig(target, onComplete)
            } else {
                if (onComplete) onComplete();
            }
        });
    },

    info: (bot, messageParts) => {
        const playerName = messageParts[1];

        const player = bot.players[playerName];
        let info = null;
        if (player) {
            info = "Pos: " + player.entity.position + "\r\n";
            info += "Vel: " + player.entity.velocity;
        } else {
            info = 'No-one is called ' + playerName;
        }

        return "Info about " + playerName + "\r\n" + info;
    },

    stop: (bot) => {
        bot.stopMoving()
        bot.stopMining()
        bot.clearTargets()
        bot.pathfinder.setGoal(null);
        bot.state = "idle";
    },

    follow: (bot, target, movement) => {
        bot.pathfinder.setMovements(movement);
        bot.pathfinder.setGoal(new GoalFollow(target, 3), true);
    },

    goToTarget: (bot, target, movement, dist = 0, cb) => {
        if (!target) {
            if (cb) cb(false);
            return;
        }
        const p = target.position;

        bot.pathfinder.setMovements(movement);
        movement.scaffoldingBlocks = []
        const goal = new GoalNear(p.x, p.y, p.z, dist);
        bot.pathfinder.setGoal(goal);

        const callbackCheck = () => {
            if (goal.isEnd(bot.entity.position.floored())) {
                cb(true);
            } else {
                setTimeout(callbackCheck.bind(this), 1000);
            }
        };

        if (cb) callbackCheck();

    },

    positionToString: (pos) => `${pos.x} ${pos.y} ${pos.z}`,

    watchFuncs: null,
    instructions: null,
    learn: (bot, target, done) => {
        this.instructions = [];
        let initialLoc = target.position;
        this.watchFuncs = {
            done,
            listener: (oldBlock, newBlock) => {
                if (newBlock == null) return;
                chat.addChat(bot, "mmm", returnAddress)
                if (target.position.floored().distanceTo(newBlock.position.floored()) < 5) {
                    chat.addChat(bot, "Yep...", returnAddress);
                    let action;
                    if (behaviours.isBlockEmpty(newBlock)) action = "dig";
                    else if (behaviours.isBlockNotEmpty(newBlock)) action = "place";
                    else action = "";
                    if (action !== "") {
                        chat.addChat(bot, "gotcha", returnAddress);
                        const deltaPos = newBlock.position.floored().minus(initialLoc);
                        this.instructions.push(`goto ${behaviours.positionToString(deltaPos)}`);
                    }
                }
            }

        };
        bot.on('blockUpdate', this.watchFuncs.listener);
        this.watchFuncs.listener(target.position.floored());
    },

    finishLearn: (bot) => {
        if (this.watchFuncs == null) return;
        bot.off('blockUpdate', this.watchFuncs.listener);
        this.watchFuncs.done(this.instructions);
        this.watchFuncs = null;
    },


    isBlockEmpty: (b) => {
        return b !== null && b.boundingBox === "empty";
    },

    isBlockNotEmpty: (b) => {
        return b !== null && b.boundingBox !== "empty";
    },

    protectFriendly: (self, other, movement, maxRange = 30) => {
        if (self.entity.position.distanceTo(other.entity.position) < maxRange) {
            behaviours.goToTarget(self, other.entity, movement, 3, () => {
                behaviours.attackNearestMob(self, movement);
            });
        }
    },

    craft: (bot, itemName, mcData, amount = 1, craftingTable = null, craftComplete) => {
        let recipes = behaviours.getRecipe(bot, itemName, amount, mcData, craftingTable);
        if (!recipes || recipes.length === 0) return craftComplete(`No recipes for ${itemName}`);
        if (recipes[0].inShape) recipes[0].inShape = recipes[0].inShape.reverse();
        bot.craft(recipes[0], amount, craftingTable, craftComplete);
    },

    getRecipe: (bot, itemName, amount, mcData, craftingTable = null) => {
        const item = behaviours.nameToItem(bot, itemName, mcData);
        if (!item) return null;
        return bot.recipesFor(item.id, null, amount, craftingTable);
    },

    setHome: (bot, position) => {
        bot.homePositon = position;
    },

    getHome: (bot) => {
        if (bot.homePositon) return bot.homePositon;
        return null;
    },
}

module.exports = behaviours;
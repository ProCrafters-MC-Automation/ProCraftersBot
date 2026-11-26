const assert = require('assert');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const { Movements } = require('mineflayer-pathfinder');
const { setupScaffolding, isWeaponItem } = require('../main');

console.log('--- Testing mineflayer-custom-pvp Local Base & Bot Setup ---');

// 1. Verify build output exists from cloned mineflayer-custom-pvp
const libPath = path.join(__dirname, '../lib');
assert.strictEqual(fs.existsSync(libPath), true, 'lib/ directory should exist from TypeScript compilation');
assert.strictEqual(fs.existsSync(path.join(libPath, 'index.js')), true, 'lib/index.js should exist');
assert.strictEqual(fs.existsSync(path.join(libPath, 'sword/swordpvp.js')), true, 'lib/sword/swordpvp.js should exist');
assert.strictEqual(fs.existsSync(path.join(libPath, 'bow/bowpvp.js')), true, 'lib/bow/bowpvp.js should exist');
console.log('1. Cloned mineflayer-custom-pvp compiled artifacts validated in lib/.');

// 2. Verify local plugin loading
const localCustomPVP = require('../lib').default || require('../lib');
assert.strictEqual(typeof localCustomPVP, 'function', 'local customPVP should be a plugin function');
console.log('2. Local mineflayer-custom-pvp plugin loaded successfully from ./lib.');

// 3. Test mock bot injection with local mineflayer-custom-pvp
const mcData = require('minecraft-data')('1.20');
const bot = new EventEmitter();
bot._client = new EventEmitter();
bot.version = '1.20';
bot.registry = mcData;
bot.supportFeature = () => false;
bot.inventory = {
    slots: {},
    items: () => [
        { name: 'diamond_sword', type: mcData.itemsByName.diamond_sword.id, count: 1 },
        { name: 'shield', type: mcData.itemsByName.shield.id, count: 1 },
        { name: 'bow', type: mcData.itemsByName.bow.id, count: 1 },
        { name: 'arrow', type: mcData.itemsByName.arrow.id, count: 64 },
        { name: 'diamond_axe', type: mcData.itemsByName.diamond_axe.id, count: 1 },
        { name: 'cobblestone', type: mcData.itemsByName.cobblestone.id, count: 64 },
        { name: 'oak_planks', type: mcData.itemsByName.oak_planks.id, count: 32 }
    ]
};
bot.entity = { position: { x: 0, y: 64, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, height: 1.6 };
bot.entities = {};
bot.players = {};
bot.loadPlugin = (p) => p(bot);
bot.getEquipmentDestSlot = () => 0;

localCustomPVP(bot);

assert.strictEqual(typeof bot.swordpvp, 'object', 'bot.swordpvp must be defined');
assert.strictEqual(typeof bot.swordpvp.attack, 'function', 'bot.swordpvp.attack must be a function');
assert.strictEqual(typeof bot.swordpvp.stop, 'function', 'bot.swordpvp.stop must be a function');
assert.strictEqual(typeof bot.bowpvp, 'object', 'bot.bowpvp must be defined');
assert.strictEqual(typeof bot.bowpvp.attack, 'function', 'bot.bowpvp.attack must be a function');
assert.strictEqual(typeof bot.bowpvp.stop, 'function', 'bot.bowpvp.stop must be a function');
assert.strictEqual(typeof bot.bowpvp.hasWeapon, 'function', 'bot.bowpvp.hasWeapon must be a function');
assert.strictEqual(typeof bot.bowpvp.hasAmmo, 'function', 'bot.bowpvp.hasAmmo must be a function');

console.log('3. bot.swordpvp and bot.bowpvp initialized onto bot successfully from local base.');

// 4. Verify SwordPVP options configuration
assert.strictEqual(typeof bot.swordpvp.options, 'object');
bot.swordpvp.options.critConfig.mode = 'hop';
bot.swordpvp.options.critConfig.enabled = true;
bot.swordpvp.options.shieldDisableConfig.enabled = true;
bot.swordpvp.options.tapConfig.mode = 'wtap';
bot.swordpvp.options.strafeConfig.enabled = true;
bot.swordpvp.options.followConfig.distance = 1.8;

assert.strictEqual(bot.swordpvp.options.critConfig.mode, 'hop');
assert.strictEqual(bot.swordpvp.options.shieldDisableConfig.enabled, true);
assert.strictEqual(bot.swordpvp.options.tapConfig.mode, 'wtap');
assert.strictEqual(bot.swordpvp.options.strafeConfig.enabled, true);
assert.strictEqual(bot.swordpvp.options.followConfig.distance, 1.8);

console.log('4. SwordPVP configurations (critConfig, shieldDisable, wtap, strafe, followConfig) validated.');

// 5. Verify BowPVP inventory detection
assert.strictEqual(bot.bowpvp.hasWeapon('bow'), true);
assert.strictEqual(bot.bowpvp.hasAmmo('bow'), true);

console.log('5. BowPVP weapon and ammo detection validated.');

// 6. Verify Scaffolding & Towering configuration
const moves = new Movements(bot, mcData);
setupScaffolding(bot, moves, mcData);

assert.strictEqual(moves.allow1by1towers, true, 'allow1by1towers should be enabled for towering');
assert.strictEqual(moves.placeCost, 1, 'placeCost should be set to 1 for responsive block placement');
assert.ok(moves.scafoldingBlocks.length > 50, 'scaffoldingBlocks should contain all solid building blocks');
assert.ok(moves.scaffoldingSet.has(mcData.itemsByName.cobblestone.id), 'cobblestone should be recognized as scaffolding');
assert.ok(moves.scaffoldingSet.has(mcData.itemsByName.oak_planks.id), 'oak_planks should be recognized as scaffolding');
assert.ok(moves.scaffoldingSet.has(mcData.itemsByName.dirt.id), 'dirt should be recognized as scaffolding');

// Verify inventory block counting and item retrieval
const blockCount = moves.countScaffoldingItems();
assert.strictEqual(blockCount, 96, 'Should count 64 cobblestone + 32 oak_planks = 96 scaffolding blocks');
const scaffoldItem = moves.getScaffoldingItem();
assert.ok(scaffoldItem && (scaffoldItem.name === 'cobblestone' || scaffoldItem.name === 'oak_planks'));

console.log('6. Dynamic Scaffolding & Towering (allow1by1towers, solid blocks, count & item retrieval) validated.');

// 7. Verify Weapon vs Block item classification
assert.strictEqual(isWeaponItem({ name: 'diamond_sword' }), true);
assert.strictEqual(isWeaponItem({ name: 'netherite_axe' }), true);
assert.strictEqual(isWeaponItem({ name: 'diamond_pickaxe' }), false);
assert.strictEqual(isWeaponItem({ name: 'cobblestone' }), false);
assert.strictEqual(isWeaponItem({ name: 'dirt' }), false);
assert.strictEqual(isWeaponItem({ name: 'oak_planks' }), false);

console.log('7. Weapon vs block differentiation verified (prevents hitting with scaffolding blocks).');

console.log('\n=== ALL PVP BOT TESTS PASSED SUCCESSFULLY! ===');

process.exit(0);

const assert = require('assert');
const { EventEmitter } = require('events');

console.log('--- Testing @nxg-org/mineflayer-custom-pvp Bot Setup ---');

// 1. Verify plugin loading
const customPVP = require('@nxg-org/mineflayer-custom-pvp').default || require('@nxg-org/mineflayer-custom-pvp');
assert.strictEqual(typeof customPVP, 'function', 'customPVP should be a function');
console.log('1. @nxg-org/mineflayer-custom-pvp package imported successfully.');

// 2. Test mock bot injection
const mcData = require('minecraft-data')('1.20');
const bot = new EventEmitter();
bot._client = new EventEmitter();
bot.version = '1.20';
bot.registry = mcData;
bot.supportFeature = () => false;
bot.inventory = {
    slots: {},
    items: () => [
        { name: 'diamond_sword' },
        { name: 'shield' },
        { name: 'bow' },
        { name: 'arrow', count: 64 },
        { name: 'diamond_axe' }
    ]
};
bot.entity = { position: { x: 0, y: 64, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, height: 1.6 };
bot.entities = {};
bot.players = {};
bot.loadPlugin = (p) => p(bot);
bot.getEquipmentDestSlot = () => 0;

customPVP(bot);

assert.strictEqual(typeof bot.swordpvp, 'object', 'bot.swordpvp must be defined');
assert.strictEqual(typeof bot.swordpvp.attack, 'function', 'bot.swordpvp.attack must be a function');
assert.strictEqual(typeof bot.swordpvp.stop, 'function', 'bot.swordpvp.stop must be a function');
assert.strictEqual(typeof bot.bowpvp, 'object', 'bot.bowpvp must be defined');
assert.strictEqual(typeof bot.bowpvp.attack, 'function', 'bot.bowpvp.attack must be a function');
assert.strictEqual(typeof bot.bowpvp.stop, 'function', 'bot.bowpvp.stop must be a function');
assert.strictEqual(typeof bot.bowpvp.hasWeapon, 'function', 'bot.bowpvp.hasWeapon must be a function');
assert.strictEqual(typeof bot.bowpvp.hasAmmo, 'function', 'bot.bowpvp.hasAmmo must be a function');

console.log('2. bot.swordpvp and bot.bowpvp loaded onto bot successfully.');

// 3. Verify SwordPVP options configuration
assert.strictEqual(typeof bot.swordpvp.options, 'object');
bot.swordpvp.options.critConfig.mode = 'hop';
bot.swordpvp.options.critConfig.enabled = true;
bot.swordpvp.options.shieldDisableConfig.enabled = true;
bot.swordpvp.options.tapConfig.mode = 'wtap';
bot.swordpvp.options.strafeConfig.enabled = true;

assert.strictEqual(bot.swordpvp.options.critConfig.mode, 'hop');
assert.strictEqual(bot.swordpvp.options.shieldDisableConfig.enabled, true);
assert.strictEqual(bot.swordpvp.options.tapConfig.mode, 'wtap');
assert.strictEqual(bot.swordpvp.options.strafeConfig.enabled, true);

console.log('3. SwordPVP configurations (critConfig, shieldDisable, wtap, strafe) validated.');

// 4. Verify BowPVP inventory detection
assert.strictEqual(bot.bowpvp.hasWeapon('bow'), true);
assert.strictEqual(bot.bowpvp.hasAmmo('bow'), true);

console.log('4. BowPVP weapon and ammo detection validated.');

console.log('\n=== ALL PVP BOT TESTS PASSED SUCCESSFULLY! ===');

const assert = require('assert');
const { parseConfig } = require('../src/config');
const { BodyguardSystem } = require('../src/bodyguard');
const { CommandsPrinter } = require('../src/commandsPrinter');
const { PlacerPrinter } = require('../src/placerPrinter');
const { SwarmManager } = require('../src/swarmManager');
const { createCommandHandler } = require('../src/commandHandler');
const mcData = require('minecraft-data');

async function runTests() {
    console.log('--- Running ProCraftersBot Unified Tests ---');

    // 1. Config parser tests
    console.log('Testing Config Parser...');
    {
        const cfg1 = parseConfig(['localhost:25565', 'Secret', 'MasterUser', 'Bot1', 'Bot2']);
        assert.strictEqual(cfg1.host, 'localhost');
        assert.strictEqual(cfg1.port, 25565);
        assert.strictEqual(cfg1.password, 'Secret');
        assert.deepStrictEqual(cfg1.master, ['MasterUser']);
        assert.deepStrictEqual(cfg1.botNames, ['Bot1', 'Bot2']);

        const cfg2 = parseConfig(['127.0.0.1', '25566', 'MyPass', 'Boss1,Boss2', 'Alpha']);
        assert.strictEqual(cfg2.host, '127.0.0.1');
        assert.strictEqual(cfg2.port, 25566);
        assert.strictEqual(cfg2.password, 'MyPass');
        assert.deepStrictEqual(cfg2.master, ['Boss1', 'Boss2']);
        assert.deepStrictEqual(cfg2.botNames, ['Alpha']);

        const cfgDefault = parseConfig([]);
        assert.strictEqual(cfgDefault.host, 'localhost');
        assert.strictEqual(cfgDefault.port, 25565);
        assert.strictEqual(cfgDefault.botNames.length > 0, true);
        console.log(' Config Parser Passed.');
    }

    // 2. Swarm Manager tests
    console.log('Testing Swarm Manager...');
    {
        const sm = new SwarmManager({ master: ['Admin'] });
        const mockBotA = { username: 'Alpha', state: 'idle', role: 'general' };
        const mockBotB = { username: 'Beta', state: 'idle', role: 'general' };
        sm.botsMap.set('Alpha', mockBotA);
        sm.botsMap.set('Beta', mockBotB);

        assert.strictEqual(sm.getAllBots().length, 2);
        assert.strictEqual(sm.getBot('Alpha').username, 'Alpha');
        assert.strictEqual(sm.getBots('Alpha,Beta').length, 2);
        assert.strictEqual(sm.getBots('all').length, 2);
        assert.strictEqual(sm.getBots('Alpha').length, 1);
        console.log(' Swarm Manager Passed.');
    }

    // 3. Bodyguard System tests
    console.log('Testing Bodyguard System...');
    {
        const bg = new BodyguardSystem();
        const fakeBot1 = {
            username: 'Guard1',
            entity: { position: { x: 0, y: 64, z: 0, distanceTo: () => 0, xzDistanceTo: () => 0 } },
            players: {},
            on: () => {},
            lookAt: () => {},
            pathfinder: { setGoal: () => {}, setMovements: () => {} }
        };
        const fakeBot2 = {
            username: 'Guard2',
            entity: { position: { x: 0, y: 64, z: 0, distanceTo: () => 0, xzDistanceTo: () => 0 } },
            players: {},
            on: () => {},
            lookAt: () => {},
            pathfinder: { setGoal: () => {}, setMovements: () => {} }
        };

        // Existing bots bodyguarding
        bg.addExistingGuards([fakeBot1, fakeBot2], 'BossPlayer');
        assert.strictEqual(fakeBot1.state, 'bodyguard');
        assert.strictEqual(fakeBot1.guardBoss, 'BossPlayer');
        assert.strictEqual(fakeBot1.guardIndex, 0);
        assert.strictEqual(fakeBot2.guardIndex, 1);
        assert.strictEqual(fakeBot1.guardDirection, 0);
        assert.strictEqual(Math.round(fakeBot2.guardDirection * 100) / 100, Math.round(Math.PI * 100) / 100);

        // Target for guards
        const fakeTarget = { name: 'Zombie', isValid: true };
        bg.setTargetForGuards('BossPlayer', fakeTarget);
        assert.strictEqual(fakeBot1.guardTarget, fakeTarget);
        assert.strictEqual(fakeBot2.guardTarget, fakeTarget);

        // Halt guards
        bg.haltGuards('BossPlayer');
        assert.strictEqual(fakeBot1.guardTarget, null);

        // Stop guards
        bg.stopGuards(fakeBot1, 'BossPlayer');
        assert.strictEqual(fakeBot1.state, 'idle');
        assert.strictEqual(bg.getGuardsForBoss('BossPlayer').length, 1);
        console.log(' Bodyguard System Passed.');
    }

    // 4. Commands Printer tests
    console.log('Testing Commands Printer...');
    {
        const cp = new CommandsPrinter();
        const coords = { x: 100, y: 64, z: 200 };
        const result = await cp.generateCommands('image.jpg', coords, { maxDimension: 16 });

        assert.strictEqual(typeof result.width, 'number');
        assert.strictEqual(typeof result.height, 'number');
        assert.strictEqual(Array.isArray(result.commands), true);
        assert.strictEqual(result.commands.length > 0, true);

        // Verify structure of commands
        const cmd = result.commands[0];
        assert.strictEqual(cmd.type === 'setblock' || cmd.type === 'fill', true);
        assert.strictEqual(typeof cmd.blockName, 'string');
        console.log(` Commands Printer Generated ${result.commands.length} optimized commands from ${result.width}x${result.height} image.`);
        console.log(' Commands Printer Passed.');
    }

    // 5. Placer Printer tests
    console.log('Testing Placer Printer...');
    {
        const pp = new PlacerPrinter();
        assert.strictEqual(typeof pp.palettes, 'object');

        const block = pp.getNearestBlockFromPalette(255, 0, 0, [
            { block: 'red_concrete', colour: [255, 0, 0] },
            { block: 'blue_concrete', colour: [0, 0, 255] }
        ]);
        assert.strictEqual(block, 'red_concrete');
        console.log(' Placer Printer Passed.');
    }

    // 6. Command Handler routing tests
    console.log('Testing Command Handler Routing...');
    {
        const sm = new SwarmManager({ master: ['Admin'] });
        const dispatched = [];
        const testBot = {
            username: 'Alpha',
            state: 'idle',
            role: 'general',
            entity: { position: { x: 0, y: 64, z: 0 } },
            players: { Admin: { entity: { position: { x: 10, y: 64, z: 10 } } } },
            chat: (msg) => dispatched.push(msg),
            pathfinder: { setGoal: () => {}, setMovements: () => {} },
            on: () => {},
            once: () => {}
        };
        sm.botsMap.set('Alpha', testBot);

        const handler = createCommandHandler(sm);

        // Test non-master ignored
        await handler('Griefer', 'Alpha stop', testBot, ['Admin']);
        assert.strictEqual(dispatched.length, 0);

        // Test status command
        await handler('Admin', 'Alpha status', testBot, ['Admin']);
        const { defaultChatQueue } = require('../src/chat');
        assert.strictEqual(defaultChatQueue.queue.length > 0, true);
        defaultChatQueue.clear();

        // Test bodyguard command on existing bot
        await handler('Admin', 'Alpha bodyguard', testBot, ['Admin']);
        assert.strictEqual(testBot.state, 'bodyguard');
        assert.strictEqual(testBot.guardBoss, 'Admin');
        defaultChatQueue.clear();

        // Test bodyguard stop
        await handler('Admin', 'Alpha bodyguard stop', testBot, ['Admin']);
        assert.strictEqual(testBot.state, 'idle');
        defaultChatQueue.clear();

        console.log(' Command Handler Routing Passed.');
    }

    // 7. Recent Minecraft Version Support tests
    console.log('Testing Recent Minecraft Versions Support...');
    {
        const protocolVersions = mcData.versions.pc.map(v => v.minecraftVersion);
        assert.strictEqual(protocolVersions.includes('1.21.1') || protocolVersions.includes('1.21'), true);

        // Full block and item data support verification for latest releases
        const targetFullDataVersions = ['1.20.6', '1.20.4', '1.20.2', '1.20.1', '1.20', '1.19.4', '1.18.2'];
        for (const ver of targetFullDataVersions) {
            const data = mcData(ver);
            assert.strictEqual(!!data && !!data.blocks, true, `Version data for ${ver} should have blocks`);
        }
        console.log(` Recent versions with full data verified: ${targetFullDataVersions.join(', ')}.`);
        console.log(' Recent Version Support Passed.');
    }

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});

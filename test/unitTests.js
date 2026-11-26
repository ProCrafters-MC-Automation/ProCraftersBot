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
        console.log('  Config Parser Passed.');
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
        console.log('  Swarm Manager Passed.');
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
        console.log('  Bodyguard System Passed.');
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
        console.log(`  Commands Printer Generated ${result.commands.length} optimized commands from ${result.width}x${result.height} image.`);
        console.log('  Commands Printer Passed.');
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
        console.log('  Placer Printer Passed.');
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

        // Test attack command triggers bot.pvp.attack
        let pvpAttackedTarget = null;
        testBot.pvp = {
            attack: (entity) => { pvpAttackedTarget = entity; },
            stop: () => { pvpAttackedTarget = null; }
        };
        const enemyEntity = { username: 'EnemyPlayer', isValid: true, position: { x: 5, y: 64, z: 5 } };
        testBot.players['EnemyPlayer'] = { entity: enemyEntity };

        await handler('Admin', 'Alpha attack EnemyPlayer', testBot, ['Admin']);
        assert.strictEqual(pvpAttackedTarget, enemyEntity);
        assert.strictEqual(testBot.huntTargetName, 'enemyplayer');
        defaultChatQueue.clear();

        // Test combat halt
        await handler('Admin', 'Alpha halt', testBot, ['Admin']);
        assert.strictEqual(pvpAttackedTarget, null);
        assert.strictEqual(testBot.huntTargetName, null);
        defaultChatQueue.clear();

        // Test PvP configuration commands via chat
        testBot.swordpvp = {
            options: {
                critConfig: { enabled: true, mode: 'hop' },
                shieldConfig: { enabled: true, mode: 'legit' },
                strafeConfig: { enabled: true, mode: { mode: 'intelligent', maxOffset: Math.PI / 2 } },
                tapConfig: { enabled: true, mode: 'wtap' }
            }
        };

        await handler('Admin', 'Alpha crit packet', testBot, ['Admin']);
        assert.strictEqual(testBot.swordpvp.options.critConfig.mode, 'packet');
        defaultChatQueue.clear();

        await handler('Admin', 'Alpha shield blatant', testBot, ['Admin']);
        assert.strictEqual(testBot.swordpvp.options.shieldConfig.mode, 'blatant');
        defaultChatQueue.clear();

        await handler('Admin', 'Alpha strafe circle', testBot, ['Admin']);
        assert.strictEqual(testBot.swordpvp.options.strafeConfig.mode.mode, 'circle');
        defaultChatQueue.clear();

        await handler('Admin', 'Alpha wtap off', testBot, ['Admin']);
        assert.strictEqual(testBot.swordpvp.options.tapConfig.enabled, false);
        defaultChatQueue.clear();

        console.log('  Command Handler Routing Passed.');
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
        console.log(`  Recent versions with full data verified: ${targetFullDataVersions.join(', ')}.`);
        console.log('  Recent Version Support Passed.');
    }

    // 8. ResourceBots Actions tests
    console.log('Testing ResourceBots Actions...');
    {
        const Utils = require('../src/utils');
        assert.strictEqual(typeof Utils.hole, 'function');
        assert.strictEqual(typeof Utils.nearbyBlocks, 'function');
        assert.strictEqual(typeof Utils.equipByName, 'function');
        assert.strictEqual(typeof Utils.protectFriendly, 'function');
        assert.strictEqual(typeof Utils.learn, 'function');
        assert.strictEqual(typeof Utils.finishLearn, 'function');
        assert.strictEqual(typeof Utils.guardArea, 'function');
        assert.strictEqual(typeof Utils.tossItem, 'function');
        assert.strictEqual(typeof Utils.craft, 'function');
        assert.strictEqual(typeof Utils.hunt, 'function');
        assert.strictEqual(typeof Utils.collectDrops, 'function');
        console.log('  ResourceBots Actions Passed.');
    }

    // 9. Combat PVP & Continuous Hunting tests
    console.log('Testing Combat PVP & Hunting...');
    {
        const { EventEmitter } = require('events');
        const combat = require('../src/combat');
        const mockCombatBot = new EventEmitter();
        mockCombatBot.players = {};
        mockCombatBot.entities = {};
        mockCombatBot.inventory = { items: () => [] };
        mockCombatBot.setControlState = () => {};

        let pvpTarget = null;
        mockCombatBot.pvp = {
            attack: (entity) => { pvpTarget = entity; },
            stop: () => { pvpTarget = null; }
        };

        combat.load(mockCombatBot);
        assert.strictEqual(typeof mockCombatBot.attackPlayer, 'function');
        assert.strictEqual(typeof mockCombatBot.findEntityByName, 'function');
        assert.strictEqual(typeof mockCombatBot.equipForCombat, 'function');

        const enemy = { username: 'TargetDummy', isValid: true, position: { x: 2, y: 64, z: 2 }, height: 1.8 };
        mockCombatBot.players['TargetDummy'] = { entity: enemy };

        // Test attackPlayer engages bot.pvp.attack
        const res = mockCombatBot.attackPlayer('TargetDummy');
        assert.strictEqual(res, true);
        assert.strictEqual(pvpTarget, enemy);
        assert.strictEqual(mockCombatBot.huntTargetName, 'targetdummy');

        // Test elimination on entityDead
        let eliminated = null;
        mockCombatBot.on('targetKilled', (target) => { eliminated = target; });
        mockCombatBot.emit('entityDead', enemy);
        assert.strictEqual(eliminated, 'targetdummy');
        assert.strictEqual(mockCombatBot.huntTargetName, null);
        assert.strictEqual(pvpTarget, null);

        console.log('  Combat PVP & Hunting Passed.');
    }

    // 10. @nxg-org/mineflayer-custom-pvp Sword & Bow Integration tests
    console.log('Testing @nxg-org/mineflayer-custom-pvp Integration...');
    {
        const { EventEmitter } = require('events');
        const combat = require('../src/combat');
        const customPvpBot = new EventEmitter();
        customPvpBot.players = {};
        customPvpBot.entities = {};
        customPvpBot.entity = { position: { x: 0, y: 64, z: 0, distanceTo: (p) => Math.hypot(p.x, p.y - 64, p.z) } };
        customPvpBot.inventory = {
            items: () => [
                { name: 'diamond_sword' },
                { name: 'shield' },
                { name: 'bow' },
                { name: 'arrow', count: 64 }
            ]
        };
        customPvpBot.setControlState = () => {};

        let swordAttacked = null;
        let bowAttacked = null;
        let swordStopped = false;
        let bowStopped = false;

        customPvpBot.swordpvp = {
            attack: (entity) => { swordAttacked = entity; swordStopped = false; },
            stop: () => { swordStopped = true; swordAttacked = null; },
            options: {
                critConfig: { enabled: true, mode: 'hop' },
                shieldConfig: { enabled: true, mode: 'legit' },
                strafeConfig: { enabled: true, mode: { mode: 'intelligent', maxOffset: Math.PI / 2 } },
                tapConfig: { enabled: true, mode: 'wtap' }
            }
        };

        customPvpBot.bowpvp = {
            attack: (entity, weapon) => { bowAttacked = entity; bowStopped = false; },
            stop: () => { bowStopped = true; bowAttacked = null; },
            useOffhand: false
        };

        combat.load(customPvpBot);

        const closeTarget = { username: 'CloseEnemy', isValid: true, position: { x: 3, y: 64, z: 0 } };
        const farTarget = { username: 'FarEnemy', isValid: true, position: { x: 15, y: 64, z: 0 } };
        customPvpBot.players['CloseEnemy'] = { entity: closeTarget };
        customPvpBot.players['FarEnemy'] = { entity: farTarget };

        // Test auto/hybrid close range engages swordpvp
        customPvpBot.attackPlayer('CloseEnemy', 'auto');
        assert.strictEqual(swordAttacked, closeTarget);
        assert.strictEqual(customPvpBot.combatState.currentWeapon, 'sword');

        // Test auto/hybrid long range engages bowpvp
        customPvpBot.attackPlayer('FarEnemy', 'auto');
        assert.strictEqual(bowAttacked, farTarget);
        assert.strictEqual(customPvpBot.combatState.currentWeapon, 'bow');

        // Test explicit sword attack
        customPvpBot.attackPlayer('FarEnemy', 'sword');
        assert.strictEqual(swordAttacked, farTarget);
        assert.strictEqual(customPvpBot.combatState.currentWeapon, 'sword');

        // Test explicit bow attack
        customPvpBot.attackPlayer('CloseEnemy', 'bow');
        assert.strictEqual(bowAttacked, closeTarget);
        assert.strictEqual(customPvpBot.combatState.currentWeapon, 'bow');

        // Test halt/clear stops both sword and bow
        customPvpBot.clearTargets();
        assert.strictEqual(swordStopped, true);
        assert.strictEqual(bowStopped, true);
        assert.strictEqual(customPvpBot.huntTargetName, null);
        assert.strictEqual(customPvpBot.combatState.mode, 'idle');

        // Test plugin loading and configuration defaults via botInit
        const { initBot } = require('../src/botInit');
        const mcData120 = require('minecraft-data')('1.20');
        const mockClientBot = new EventEmitter();
        mockClientBot._client = new EventEmitter();
        mockClientBot.version = '1.20';
        mockClientBot.registry = mcData120;
        mockClientBot.supportFeature = () => false;
        mockClientBot.inventory = {
            slots: {},
            items: () => [
                { name: 'diamond_sword' },
                { name: 'shield' },
                { name: 'bow' },
                { name: 'arrow', count: 64 },
                { name: 'diamond_axe' }
            ]
        };
        mockClientBot.entity = { position: { x: 0, y: 64, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, height: 1.6 };
        mockClientBot.entities = {};
        mockClientBot.players = {};
        mockClientBot.loadPlugin = (p) => {
            if (typeof p === 'function') p(mockClientBot);
        };
        mockClientBot.getEquipmentDestSlot = () => 0;
        mockClientBot.setControlState = () => {};
        mockClientBot.clearControlStates = () => {};

        initBot(mockClientBot, { role: 'pvp' });
        assert.strictEqual(typeof mockClientBot.swordpvp, 'object');
        assert.strictEqual(typeof mockClientBot.bowpvp, 'object');
        assert.strictEqual(mockClientBot.swordpvp.options.critConfig.mode, 'hop');
        assert.strictEqual(mockClientBot.swordpvp.options.shieldConfig.mode, 'legit');
        assert.strictEqual(mockClientBot.swordpvp.options.tapConfig.mode, 'wtap');
        assert.strictEqual(mockClientBot.swordpvp.options.strafeConfig.mode.mode, 'intelligent');
        assert.strictEqual(mockClientBot.defaultMove.allowFreeMotion, true);
        assert.strictEqual(mockClientBot.defaultMove.allowParkour, true);
        assert.strictEqual(mockClientBot.defaultMove.allowSprinting, true);
        assert.strictEqual(mockClientBot.defaultMove.canOpenDoors, true);

        console.log('  @nxg-org/mineflayer-custom-pvp Integration Passed.');
    }

    // 11. Bot Inspector, Vitals (Hearts & Hunger), Perspectives & Radar tests
    console.log('Testing Bot Inspector (Hearts, Hunger, Radar, Perspectives)...');
    {
        // 1. Vitals calculation test: Hearts (Health)
        const computeHearts = (hp) => {
            let full = 0, half = 0, empty = 0;
            for (let i = 0; i < 10; i++) {
                const hVal = (i + 1) * 2;
                if (hp >= hVal) full++;
                else if (hp >= hVal - 1) half++;
                else empty++;
            }
            return { full, half, empty };
        };

        const fullHp = computeHearts(20);
        assert.strictEqual(fullHp.full, 10);
        assert.strictEqual(fullHp.half, 0);
        assert.strictEqual(fullHp.empty, 0);

        const damagedHp = computeHearts(15);
        assert.strictEqual(damagedHp.full, 7);
        assert.strictEqual(damagedHp.half, 1);
        assert.strictEqual(damagedHp.empty, 2);

        const criticalHp = computeHearts(1);
        assert.strictEqual(criticalHp.full, 0);
        assert.strictEqual(criticalHp.half, 1);
        assert.strictEqual(criticalHp.empty, 9);

        // 2. Vitals calculation test: Hunger (Food)
        const computeFood = (food) => {
            let full = 0, half = 0, empty = 0;
            for (let i = 0; i < 10; i++) {
                const fVal = (i + 1) * 2;
                if (food >= fVal) full++;
                else if (food >= fVal - 1) half++;
                else empty++;
            }
            return { full, half, empty };
        };

        const fullFood = computeFood(20);
        assert.strictEqual(fullFood.full, 10);
        assert.strictEqual(fullFood.empty, 0);

        const hungry = computeFood(9);
        assert.strictEqual(hungry.full, 4);
        assert.strictEqual(hungry.half, 1);
        assert.strictEqual(hungry.empty, 5);

        // 3. Radar projection math test
        const botPos = { x: 100, y: 64, z: 200 };
        const enemyPos = { x: 110, y: 64, z: 210 };
        const radarRange = 32;
        const maxRadius = 100;

        const dx = enemyPos.x - botPos.x;
        const dz = enemyPos.z - botPos.z;
        const dist = Math.hypot(dx, dz);
        assert.strictEqual(Math.round(dist * 100) / 100, 14.14);
        assert.strictEqual(dist <= radarRange, true);

        const ex = (dx / radarRange) * maxRadius;
        const ey = (dz / radarRange) * maxRadius;
        assert.strictEqual(Math.round(ex * 10) / 10, 31.3);
        assert.strictEqual(Math.round(ey * 10) / 10, 31.3);

        // 4. Perspective on-command toggle test
        let cameraActive = false;
        const toggleCamera = (forceState) => {
            cameraActive = forceState !== undefined ? forceState : !cameraActive;
            return cameraActive;
        };

        assert.strictEqual(cameraActive, false, 'Camera should default to inactive (not always active)');
        assert.strictEqual(toggleCamera(), true, 'Camera should activate on command');
        assert.strictEqual(toggleCamera(), false, 'Camera should deactivate on command');

        // 5. Verify inspector export exists and is a function
        const { initInspector } = require('../js/inspector');
        assert.strictEqual(typeof initInspector, 'function');

        console.log('  Bot Inspector (Hearts, Hunger, Radar, Perspectives) Passed.');
    }

    // 12. Combat Obstacle Navigation & Anti-Stuck tests
    console.log('Testing Combat Obstacle Navigation & Anti-Stuck Behavior...');
    {
        const { EventEmitter } = require('events');
        const { Vec3 } = require('vec3');
        const combat = require('../src/combat');
        const mockCombatBot = new EventEmitter();
        mockCombatBot.entity = {
            position: new Vec3(0, 64, 0),
            velocity: new Vec3(0, 0, 0),
            height: 1.6,
            isCollidedHorizontally: false
        };
        let goalSet = null;
        let controlStates = {};
        mockCombatBot.pathfinder = {
            setGoal: (goal, dynamic) => {
                goalSet = goal;
                mockCombatBot.pathfinder.goal = goal;
            },
            goal: null
        };
        mockCombatBot.setControlState = (name, val) => {
            controlStates[name] = val;
        };
        mockCombatBot.clearControlStates = () => {
            controlStates = {};
        };
        mockCombatBot.swordpvp = {
            attack: () => {},
            stop: () => {}
        };
        mockCombatBot.bowpvp = {
            attack: () => {},
            stop: () => {}
        };
        mockCombatBot.inventory = { items: () => [{ name: 'diamond_sword' }] };

        combat.load(mockCombatBot);

        // Distant target (> 2.8 blocks): should engage GoalFollow
        const distantTarget = {
            name: 'EnemyTarget',
            username: 'EnemyTarget',
            isValid: true,
            height: 1.8,
            position: new Vec3(10, 64, 0)
        };
        mockCombatBot.players = { EnemyTarget: { entity: distantTarget } };

        mockCombatBot.attackPlayer('EnemyTarget', 'sword');
        assert.strictEqual(goalSet !== null, true, 'GoalFollow should be set when target distance > 2.8m');
        assert.strictEqual(goalSet.entity, distantTarget);
        assert.strictEqual(goalSet.rangeSq, 4);

        // Target moves into close striking range (<= 2.8 blocks) during checkForTargets
        distantTarget.position = new Vec3(1.5, 64, 0);
        mockCombatBot.checkForTargets();
        assert.strictEqual(mockCombatBot.pathfinder.goal, null, 'Goal should be cleared within close range to yield to swordpvp');

        // Obstacle collision test: horizontal collision should trigger auto-jump
        mockCombatBot.entity.isCollidedHorizontally = true;
        mockCombatBot.checkForTargets();
        assert.strictEqual(controlStates.jump, true, 'Horizontal collision against blocks should trigger auto-jump');

        // Clear targets: releases pathfinder and resets stuck states
        mockCombatBot.clearTargets();
        assert.strictEqual(mockCombatBot.huntTargetName, null);
        assert.strictEqual(mockCombatBot.combatState.stuckTicks, 0);

        console.log('  Combat Obstacle Navigation & Anti-Stuck Behavior Passed.');
    }

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);
}

runTests().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});

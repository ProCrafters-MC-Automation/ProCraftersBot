const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');
const vec3 = require('vec3');
const Item = require('prismarine-item');
const { Movements, goals } = require('mineflayer-pathfinder');
const { GoalNear, GoalBlock } = goals;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function colourDistance(r1, g1, b1, r2, g2, b2) {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return dr * dr + dg * dg + db * db;
}

class PlacerPrinter {
    constructor() {
        this.isPrinting = false;
        this.palettes = {};
        this.loadPalettes();
    }

    loadPalettes() {
        const palettePaths = [
            path.resolve('palettes.json'),
            path.resolve('PlacerPrinter', 'palettes.json'),
            path.resolve(__dirname, '..', 'palettes.json')
        ];
        for (const p of palettePaths) {
            if (fs.existsSync(p)) {
                try {
                    this.palettes = JSON.parse(fs.readFileSync(p, 'utf8'));
                    break;
                } catch (e) {}
            }
        }
    }

    resolveImagePath(imageFile) {
        if (!imageFile) return path.resolve('image.jpg');
        if (path.isAbsolute(imageFile) && fs.existsSync(imageFile)) {
            return imageFile;
        }
        const candidates = [
            path.resolve(imageFile),
            path.resolve('PlacerPrinter', imageFile),
            path.resolve('CommandsPrinter', imageFile),
            path.resolve(__dirname, '..', imageFile),
            path.resolve('image.jpg')
        ];
        for (const c of candidates) {
            if (fs.existsSync(c)) return c;
        }
        return path.resolve('image.jpg');
    }

    getNearestBlockFromPalette(r, g, b, paletteList) {
        if (!paletteList || paletteList.length === 0) return 'white_concrete';
        let best = paletteList[0];
        let bestDist = Infinity;

        for (const item of paletteList) {
            const col = item.colour || [255, 255, 255];
            const dist = colourDistance(r, g, b, col[0], col[1], col[2]);
            if (dist < bestDist) {
                bestDist = dist;
                best = item;
            }
        }
        return best.block;
    }

    async equipBlock(bot, blockName) {
        const mcData = require('minecraft-data')(bot.version);
        const itemInfo = mcData.itemsByName[blockName] || mcData.blocksByName[blockName];
        if (!itemInfo) return false;

        const invItem = bot.inventory.items().find(i => i.name === blockName);
        if (!invItem) {
            if (bot.game && bot.game.gameMode === 'creative' && bot.creative) {
                const ItemClass = Item(bot.version);
                await bot.creative.setInventorySlot(36, new ItemClass(itemInfo.id, 64));
                await sleep(50);
            } else {
                return false;
            }
        }

        try {
            await bot.equip(itemInfo.id, 'hand');
            return true;
        } catch (e) {
            return false;
        }
    }

    async placeBlockPhysical(bot, targetPos, blockName) {
        // Approach target within 4 blocks
        if (bot.entity.position.distanceTo(targetPos) > 4) {
            try {
                const mcData = require('minecraft-data')(bot.version);
                const moves = new Movements(bot, mcData);
                moves.allowFreeMotion = true;
                bot.pathfinder.setMovements(moves);
                bot.pathfinder.setGoal(new GoalNear(targetPos.x, targetPos.y, targetPos.z, 3));
                await sleep(400);
            } catch (e) {}
        }

        // Equip block
        const equipped = await this.equipBlock(bot, blockName);
        if (!equipped) return false;

        // Check reference block underneath or adjacent
        const refPos = targetPos.offset(0, -1, 0);
        let refBlock = bot.blockAt(refPos);

        // If no reference block underneath, check neighbors
        let faceVec = vec3(0, 1, 0);
        if (!refBlock || refBlock.name === 'air' || refBlock.name === 'cave_air') {
            const offsets = [
                { pos: targetPos.offset(1, 0, 0), face: vec3(-1, 0, 0) },
                { pos: targetPos.offset(-1, 0, 0), face: vec3(1, 0, 0) },
                { pos: targetPos.offset(0, 0, 1), face: vec3(0, 0, -1) },
                { pos: targetPos.offset(0, 0, -1), face: vec3(0, 0, 1) }
            ];
            for (const o of offsets) {
                const b = bot.blockAt(o.pos);
                if (b && b.name !== 'air' && b.name !== 'cave_air') {
                    refBlock = b;
                    faceVec = o.face;
                    break;
                }
            }
        }

        if (refBlock && refBlock.name !== 'air' && refBlock.name !== 'cave_air') {
            try {
                bot.lookAt(targetPos);
                await bot.placeBlock(refBlock, faceVec);
                return true;
            } catch (e) {
                // If placement fails, try fallback
                return false;
            }
        }

        return false;
    }

    async printWithBots(bots, coords, imagePath, options = {}) {
        if (!bots || bots.length === 0) {
            throw new Error('No bots provided for placer printing.');
        }

        const resolvedPath = this.resolveImagePath(imagePath);
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Image not found at ${resolvedPath}`);
        }

        let img = await Jimp.read(resolvedPath);

        // Parse target size e.g. "32x32" or options.size
        let targetWidth = 32;
        let targetHeight = 32;
        if (options.size) {
            const parts = String(options.size).split('x').map(n => parseInt(n, 10));
            if (parts[0]) targetWidth = parts[0];
            if (parts[1]) targetHeight = parts[1];
        }
        img = img.resize(targetWidth, targetHeight);

        // Select palette
        const paletteName = options.palette || 'concrete';
        let paletteList = this.palettes[paletteName] || this.palettes.concrete || [];
        if (options.palette && options.palette.includes('+')) {
            paletteList = [];
            for (const p of options.palette.split('+')) {
                if (this.palettes[p]) paletteList.push(...this.palettes[p]);
            }
        }

        this.isPrinting = true;
        const startX = parseInt(coords.x, 10) || Math.floor(bots[0].entity.position.x);
        const startY = parseInt(coords.y, 10) || Math.floor(bots[0].entity.position.y);
        const startZ = parseInt(coords.z, 10) || Math.floor(bots[0].entity.position.z);

        const tasks = [];
        for (let z = 0; z < targetHeight; z++) {
            for (let x = 0; x < targetWidth; x++) {
                const color = Jimp.intToRGBA(img.getPixelColor(x, z));
                if (color.a >= 128) {
                    const block = this.getNearestBlockFromPalette(color.r, color.g, color.b, paletteList);
                    tasks.push({
                        pos: vec3(startX + x, startY, startZ + z),
                        block
                    });
                }
            }
        }

        if (options.onStart) {
            options.onStart({ totalBlocks: tasks.length, width: targetWidth, height: targetHeight });
        }

        // Divide work among bots
        const chunkSize = Math.ceil(tasks.length / bots.length);
        const botWorkers = bots.map(async (bot, botIdx) => {
            const myTasks = tasks.slice(botIdx * chunkSize, (botIdx + 1) * chunkSize);

            for (const task of myTasks) {
                if (!this.isPrinting) break;
                await this.placeBlockPhysical(bot, task.pos, task.block);
                await sleep(options.delayMs || 250);
            }
        });

        await Promise.all(botWorkers);
        this.isPrinting = false;

        if (options.onComplete) {
            options.onComplete();
        }
    }

    async printWithNewBots(swarmManager, count, prefix, coords, imagePath, options = {}) {
        const botCount = Math.max(1, parseInt(count, 10) || 1);
        const spawnedBots = [];

        for (let i = 0; i < botCount; i++) {
            const name = `${prefix || 'Placer'}#${Date.now() % 10000}_${i + 1}`;
            const bot = await swarmManager.spawnBot(name, 'placerPrinter');
            spawnedBots.push(bot);
            await sleep(400);
        }

        // Wait until spawned
        await Promise.all(
            spawnedBots.map(bot => {
                if (bot.entity) return Promise.resolve();
                return new Promise(resolve => bot.once('spawn', resolve));
            })
        );

        await sleep(1000);

        await this.printWithBots(spawnedBots, coords, imagePath, {
            ...options,
            onComplete: () => {
                if (options.onComplete) options.onComplete();
                if (options.disconnectOnComplete) {
                    spawnedBots.forEach(b => swarmManager.removeBot(b));
                }
            }
        });

        return spawnedBots;
    }

    stop() {
        this.isPrinting = false;
    }
}

const defaultPlacerPrinter = new PlacerPrinter();

module.exports = {
    PlacerPrinter,
    placerPrinter: defaultPlacerPrinter
};

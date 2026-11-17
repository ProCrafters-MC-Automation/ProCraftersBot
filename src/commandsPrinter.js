const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');
const colorMap = require('../colorMap.json');
const getNearestBlockByColor = require('nearest-color').from(colorMap);
const chillout = require('chillout');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function intToRgba(int) {
    return {
        r: (int >>> 24) & 0xff,
        g: (int >>> 16) & 0xff,
        b: (int >>> 8) & 0xff,
        a: int & 0xff
    };
}

function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function isFellableBlock(blockName) {
    if (!blockName) return false;
    return blockName.includes('sand') || blockName.includes('powder') || blockName.includes('gravel');
}

async function chunk(arr, n) {
    if (!arr || !n || n <= 0) return [arr];
    const length = arr.length;
    let slicePoint = 0;
    const result = [];

    while (slicePoint < length) {
        result.push(arr.slice(slicePoint, slicePoint + n));
        slicePoint += n;
    }
    return result;
}

class CommandsPrinter {
    constructor() {
        this.isPrinting = false;
        this.activePrinters = [];
    }

    /**
     * Resolve image file path safely
     */
    resolveImagePath(imageFile) {
        if (!imageFile) return path.resolve('image.jpg');
        if (path.isAbsolute(imageFile) && fs.existsSync(imageFile)) {
            return imageFile;
        }
        const candidates = [
            path.resolve(imageFile),
            path.resolve('CommandsPrinter', imageFile),
            path.resolve('PlacerPrinter', imageFile),
            path.resolve(__dirname, '..', imageFile),
            path.resolve('image.jpg')
        ];
        for (const c of candidates) {
            if (fs.existsSync(c)) return c;
        }
        return path.resolve('image.jpg');
    }

    /**
     * Load image and generate optimized command list
     */
    async generateCommands(imagePath, startCoords, options = {}) {
        const resolvedPath = this.resolveImagePath(imagePath);
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Image not found at ${resolvedPath}`);
        }

        let img = await Jimp.read(resolvedPath);

        // Optional resizing if image is very large
        if (options.maxDimension && (img.bitmap.width > options.maxDimension || img.bitmap.height > options.maxDimension)) {
            img = img.scaleToFit(options.maxDimension, options.maxDimension);
        }

        const allData = [];
        const width = img.bitmap.width;
        const height = img.bitmap.height;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelColor = img.getPixelColor(x, y);
                const rgba = intToRgba(pixelColor);
                if (rgba.a >= 128) {
                    const hexColor = rgbToHex(rgba.r, rgba.g, rgba.b);
                    const nearest = getNearestBlockByColor(hexColor);
                    if (nearest && nearest.name) {
                        allData.push({ x, y, blockName: nearest.name });
                    }
                }
            }
        }

        if (allData.length === 0) {
            throw new Error('No printable pixels found in image.');
        }

        // Optimize horizontal spans into /fill
        const optimizedData = [];
        let tmpArr = [];
        let lastY = allData[0].y;
        let lastBlock = allData[0].blockName;

        for (let i = 0; i < allData.length; i++) {
            const el = allData[i];
            if (lastBlock === el.blockName && lastY === el.y && (tmpArr.length === 0 || el.x === tmpArr[tmpArr.length - 1].x + 1)) {
                tmpArr.push(el);
            } else {
                if (tmpArr.length > 1) {
                    const first = tmpArr[0];
                    const last = tmpArr[tmpArr.length - 1];
                    optimizedData.push({
                        type: 'fill',
                        x1: first.x,
                        y1: first.y,
                        x2: last.x,
                        y2: last.y,
                        blockName: first.blockName
                    });
                } else if (tmpArr.length === 1) {
                    optimizedData.push({ type: 'setblock', ...tmpArr[0] });
                }
                tmpArr = [el];
                lastBlock = el.blockName;
                lastY = el.y;
            }
        }

        if (tmpArr.length > 1) {
            const first = tmpArr[0];
            const last = tmpArr[tmpArr.length - 1];
            optimizedData.push({
                type: 'fill',
                x1: first.x,
                y1: first.y,
                x2: last.x,
                y2: last.y,
                blockName: first.blockName
            });
        } else if (tmpArr.length === 1) {
            optimizedData.push({ type: 'setblock', ...tmpArr[0] });
        }

        return {
            width,
            height,
            commands: optimizedData
        };
    }

    /**
     * Print using an array of existing bot instances
     */
    async printWithBots(bots, coords, imagePath, options = {}) {
        if (!bots || bots.length === 0) {
            throw new Error('No bots provided for command printing.');
        }

        const placementDelayMs = options.placementDelayMs || 5;
        const perBotOffsetMs = options.perBotOffsetMs || 10;
        const scaffoldBlock = options.scaffoldBlock || 'stone';
        const offsetX = parseInt(coords.x, 10) || 0;
        const offsetY = parseInt(coords.y, 10) || 64;
        const offsetZ = parseInt(coords.z, 10) || 0;

        this.isPrinting = true;
        this.activePrinters = bots;

        const { width, height, commands } = await this.generateCommands(imagePath, coords, options);
        const botCount = bots.length;
        const chunkSize = Math.ceil(commands.length / botCount);
        const dataChunks = await chunk(commands, chunkSize);

        if (options.onStart) {
            options.onStart({
                totalCommands: commands.length,
                width,
                height,
                botCount
            });
        }

        const tasks = dataChunks.map(async (dataChunk, chunkIndex) => {
            const bot = bots[chunkIndex];
            if (!bot) return;

            // Teleport near chunk center if permitted
            try {
                const center = dataChunk[Math.floor(dataChunk.length / 2)];
                const cx = center.x != null ? center.x : center.x1;
                const cy = center.y != null ? center.y : center.y1;
                bot.chat(`/tp ${offsetX + cx} ${offsetY + 2} ${offsetZ + cy}`);
            } catch (e) {}

            await sleep(perBotOffsetMs * chunkIndex);

            for (let i = 0; i < dataChunk.length; i++) {
                if (!this.isPrinting) break; // cancelled
                const data = dataChunk[i];

                try {
                    switch (data.type) {
                        case 'setblock': {
                            const { blockName, x, y } = data;
                            if (isFellableBlock(blockName)) {
                                bot.chat(`/setblock ${offsetX + x} ${offsetY - 1} ${offsetZ + y} ${scaffoldBlock}`);
                                await sleep(placementDelayMs);
                            }
                            bot.chat(`/setblock ${offsetX + x} ${offsetY} ${offsetZ + y} ${blockName}`);
                            break;
                        }
                        case 'fill': {
                            const { blockName, x1, y1, x2, y2 } = data;
                            if (isFellableBlock(blockName)) {
                                bot.chat(`/fill ${offsetX + x1} ${offsetY - 1} ${offsetZ + y1} ${offsetX + x2} ${offsetY - 1} ${offsetZ + y2} ${scaffoldBlock}`);
                                await sleep(placementDelayMs);
                            }
                            bot.chat(`/fill ${offsetX + x1} ${offsetY} ${offsetZ + y1} ${offsetX + x2} ${offsetY} ${offsetZ + y2} ${blockName}`);
                            break;
                        }
                    }
                } catch (err) {
                    console.error(`[CommandsPrinter Bot ${bot.username}]`, err.message);
                }

                await sleep(placementDelayMs);
            }
        });

        await Promise.all(tasks);
        this.isPrinting = false;

        if (options.onComplete) {
            options.onComplete();
        }
    }

    /**
     * Spawn new bots into the server to perform command printing
     */
    async printWithNewBots(swarmManager, count, prefix, coords, imagePath, options = {}) {
        const botCount = Math.max(1, parseInt(count, 10) || 1);
        const spawnedBots = [];

        for (let i = 0; i < botCount; i++) {
            const name = `${prefix || 'CmdPrinter'}#${Date.now() % 10000}_${i + 1}`;
            const bot = await swarmManager.spawnBot(name, 'commandPrinter');
            spawnedBots.push(bot);
            await sleep(400);
        }

        // Wait until all spawned bots have spawned
        await Promise.all(
            spawnedBots.map(bot => {
                if (bot.entity) return Promise.resolve();
                return new Promise(resolve => bot.once('spawn', resolve));
            })
        );

        // Give them a moment to complete login
        await sleep(1000);

        await this.printWithBots(spawnedBots, coords, imagePath, {
            ...options,
            onComplete: () => {
                if (options.onComplete) options.onComplete();
                // If autoDisconnect is enabled or requested
                if (options.disconnectOnComplete) {
                    spawnedBots.forEach(b => swarmManager.removeBot(b));
                }
            }
        });

        return spawnedBots;
    }

    stop() {
        this.isPrinting = false;
        this.activePrinters = [];
    }
}

const defaultCommandsPrinter = new CommandsPrinter();

module.exports = {
    CommandsPrinter,
    commandsPrinter: defaultCommandsPrinter
};

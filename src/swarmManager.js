const mineflayer = require('mineflayer');
const { initBot } = require('./botInit');

class SwarmManager {
    constructor(config = {}) {
        this.config = config;
        this.host = config.host || 'localhost';
        this.port = config.port || 25565;
        this.password = config.password || 'Password';
        this.master = config.master || ['Master'];
        this.viewDistance = config.viewDistance || 'normal';

        this.botsMap = new Map();
        this.commandHandler = null;
    }

    setCommandHandler(handler) {
        this.commandHandler = handler;
    }

    getAllBots() {
        return Array.from(this.botsMap.values());
    }

    getBot(name) {
        return this.botsMap.get(name) || null;
    }

    /**
     * Get bots matching a list of names, or all bots if 'all'
     * @param {string[]|string} names
     */
    getBots(names) {
        if (!names || names === 'all' || (Array.isArray(names) && names.includes('all'))) {
            return this.getAllBots();
        }
        if (typeof names === 'string') {
            names = names.split(',').map(s => s.trim()).filter(Boolean);
        }
        return names.map(n => this.getBot(n)).filter(Boolean);
    }

    /**
     * Spawn a single bot into the server
     */
    async spawnBot(username, role = 'general') {
        if (this.botsMap.has(username)) {
            console.log(`[Swarm] Bot ${username} already exists.`);
            return this.botsMap.get(username);
        }

        const bot = mineflayer.createBot({
            host: this.host,
            port: this.port,
            username: username,
            viewDistance: this.viewDistance
        });

        initBot(bot, {
            password: this.password,
            master: this.master,
            commandHandler: this.commandHandler,
            role
        });

        this.botsMap.set(username, bot);

        bot.once('end', () => {
            this.botsMap.delete(username);
            console.log(`[Swarm] Bot ${username} disconnected.`);
        });

        return bot;
    }

    /**
     * Spawn multiple bots
     */
    async spawnBots(count = 1, prefix = 'Bot', role = 'general', delayMs = 500) {
        const spawned = [];
        for (let i = 0; i < count; i++) {
            const name = `${prefix}#${Date.now() % 10000}_${i + 1}`;
            const bot = await this.spawnBot(name, role);
            spawned.push(bot);
            if (delayMs > 0 && i < count - 1) {
                await new Promise(r => setTimeout(r, delayMs));
            }
        }
        return spawned;
    }

    /**
     * Remove and disconnect a bot
     */
    removeBot(botOrName) {
        const username = typeof botOrName === 'string' ? botOrName : (botOrName ? botOrName.username : null);
        if (!username) return;

        const bot = this.botsMap.get(username);
        if (bot) {
            try {
                if (typeof bot.quit === 'function') bot.quit();
                if (typeof bot.end === 'function') bot.end();
            } catch (e) {}
            this.botsMap.delete(username);
            console.log(`[Swarm] Removed bot ${username}`);
        }
    }

    /**
     * Disconnect all bots and clean up
     */
    stopAll() {
        for (const [name, bot] of this.botsMap.entries()) {
            try {
                if (typeof bot.quit === 'function') bot.quit();
            } catch (e) {}
        }
        this.botsMap.clear();
    }
}

module.exports = {
    SwarmManager
};

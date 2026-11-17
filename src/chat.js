/**
 * Rate-limited chat queue for Mineflayer bots
 */

class ChatQueue {
    constructor(waitTime = 1000) {
        this.queue = [];
        this.waitTime = waitTime;
        this.running = false;
        this.timer = null;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.processNext();
    }

    stop() {
        this.running = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    processNext() {
        if (!this.running) return;

        if (this.queue.length > 0) {
            const item = this.queue.shift();
            try {
                if (item.bot && typeof item.bot.chat === 'function') {
                    item.bot.chat(item.message);
                }
            } catch (err) {
                console.error('[ChatQueue Error]', err);
            }
        }

        this.timer = setTimeout(() => this.processNext(), this.waitTime);
        if (this.timer && typeof this.timer.unref === 'function') {
            this.timer.unref();
        }
    }

    addChat(bot, message, directTo = null) {
        if (!message) return;
        const text = String(message);

        text.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            let formatted = trimmed;
            if (directTo) {
                formatted = `/msg ${directTo} ${trimmed}`;
            }

            this.queue.push({ bot, message: formatted });
        });

        if (!this.running) {
            this.start();
        }
    }

    clear() {
        this.queue = [];
    }
}

const defaultChatQueue = new ChatQueue(1200);
defaultChatQueue.start();

module.exports = {
    ChatQueue,
    defaultChatQueue,
    start: () => defaultChatQueue.start(),
    stop: () => defaultChatQueue.stop(),
    addChat: (bot, message, directTo) => defaultChatQueue.addChat(bot, message, directTo)
};

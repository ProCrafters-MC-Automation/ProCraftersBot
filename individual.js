/**
 * Individual bot chat handler compatibility wrapper
 */

const { createCommandHandler } = require('./src/commandHandler');
const { SwarmManager } = require('./src/swarmManager');

let defaultManager = null;
let defaultHandler = null;

function handleChat(username, message, bot, master, chat, isWhisper = false) {
    if (!defaultManager) {
        defaultManager = new SwarmManager({
            master: Array.isArray(master) ? master : [master]
        });
        defaultHandler = createCommandHandler(defaultManager);
    }
    return defaultHandler(username, message, bot, master, isWhisper);
}

module.exports = {
    handleChat
};

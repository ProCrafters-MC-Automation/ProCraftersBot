/**
 * Configuration and CLI argument parser for ProCraftersBot
 */

function parseConfig(args = process.argv.slice(2)) {
    let host = 'localhost';
    let port = 25565;
    let password = 'Password';
    let master = ['Master'];
    let botNames = ['Alpha', 'Beta'];

    if (args.length > 0) {
        // Check if first arg has host:port format
        if (args[0].includes(':')) {
            const parts = args[0].split(':');
            host = parts[0] || 'localhost';
            port = parseInt(parts[1], 10) || 25565;

            if (args[1]) password = args[1];
            if (args[2]) {
                master = args[2].split(',').map(m => m.trim()).filter(Boolean);
            }
            if (args.length > 3) {
                botNames = args.slice(3);
            }
        } else if (args.length > 1 && !isNaN(parseInt(args[1], 10))) {
            // Pattern: host port password master bot1 bot2 ...
            host = args[0];
            port = parseInt(args[1], 10) || 25565;

            if (args[2]) password = args[2];
            if (args[3]) {
                master = args[3].split(',').map(m => m.trim()).filter(Boolean);
            }
            if (args.length > 4) {
                botNames = args.slice(4);
            }
        } else {
            // Fallback pattern
            host = args[0];
            if (args[1]) password = args[1];
            if (args[2]) {
                master = args[2].split(',').map(m => m.trim()).filter(Boolean);
            }
            if (args.length > 3) {
                botNames = args.slice(3);
            }
        }
    }

    // Filter out empty bot names and ensure at least one bot
    botNames = botNames.filter(Boolean);
    if (botNames.length === 0) {
        botNames = ['Alpha'];
    }

    return {
        host,
        port,
        password,
        master: Array.isArray(master) ? master : [master],
        botNames,
        viewDistance: 'normal'
    };
}

module.exports = {
    parseConfig
};

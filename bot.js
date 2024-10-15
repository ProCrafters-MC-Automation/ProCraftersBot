// bot.js
const mineflayer = require('mineflayer');
const { spawn } = require('child_process');

// Configuration for your Minecraft server
const bot = mineflayer.createBot({
    host: 'localhost', // Minecraft server IP
    port: 25565,       // Minecraft server port
    username: 'LLMBot', // Bot's username
    // If you have a password for the server:
    // auth: 'password',
});

// Function to generate a response using the Python script
function generateResponse(message) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['generate_response.py', message]);

        let response = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
            response += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(`Python script exited with code ${code}: ${error}`);
            } else {
                resolve(response.trim());
            }
        });
    });
}

// When the bot is spawned and ready
bot.on('spawn', () => {
    console.log('LLMBot has spawned in the game.');
});

// Listen to chat messages
bot.on('chat', async (username, message) => {
    // Ignore messages from the bot itself
    if (username === bot.username) return;

    console.log(`[${username}]: ${message}`);

    if (message.startsWith('!')) {
        // Handle as a command
        const command = message.slice(1).trim().toLowerCase();
        handleCommand(command, username);
    } else {
        // Handle as a conversation
        try {
            console.log("Generating response...");
            const reply = await generateResponse(message);
            bot.chat(reply);
        } catch (error) {
            console.error('Error generating response:', error);
            bot.chat("Sorry, I couldn't process that.");
        }
    }
});

// Function to handle physical commands
function handleCommand(command, username) {
    switch (command) {
        case 'jump':
            bot.jump();
            bot.chat(`${username} made me jump!`);
            break;
        case 'forward':
            bot.setControlState('forward', true);
            setTimeout(() => {
                bot.setControlState('forward', false);
                bot.chat(`${username} made me move forward!`);
            }, 2000);
            break;
        case 'back':
            bot.setControlState('back', true);
            setTimeout(() => {
                bot.setControlState('back', false);
                bot.chat(`${username} made me move back!`);
            }, 2000);
            break;
        case 'left':
            bot.setControlState('left', true);
            setTimeout(() => {
                bot.setControlState('left', false);
                bot.chat(`${username} made me move left!`);
            }, 2000);
            break;
        case 'right':
            bot.setControlState('right', true);
            setTimeout(() => {
                bot.setControlState('right', false);
                bot.chat(`${username} made me move right!`);
            }, 2000);
            break;
        case 'dance':
            // Example: Make the bot jump repeatedly
            bot.chat(`${username} made me dance!`);
            let danceInterval = setInterval(() => {
                bot.jump();
            }, 500);
            setTimeout(() => {
                clearInterval(danceInterval);
                bot.chat("Dance time's over!");
            }, 5000);
            break;
        default:
            bot.chat("I don't recognize that command.");
    }
}

// Handle errors
bot.on('error', (err) => {
    console.error('Bot encountered an error:', err);
});

// Handle the bot being kicked or disconnecting
bot.on('end', () => {
    console.log('Bot has been disconnected from the server.');
});

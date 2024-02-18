const { GoogleGenerativeAI } = require("@google/generative-ai");
const prompt = require('prompt-sync')();
const fs = require('fs');
const mineflayer = require('mineflayer')

const source = "LLM/behaviors/";
const historyFile = "conversation_history.json";

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// For text-only input, use the gemini-pro model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

let history = loadHistory(historyFile);

const chat = model.startChat({
    history: history
});

const bot = mineflayer.createBot({
    host: process.argv[2],
    port: parseInt(process.argv[3]),
    username: process.argv[4] ? process.argv[4] : 'Bot',
})

bot.on('chat', (username, message) => {
    if (username === bot.username) return
    runChat(bot, message)
})

function extractCodeToFile(code) {
    const codeDelimiter = '```', nameDelimiter = '"';
    const codeStartIndex = code.indexOf(codeDelimiter);
    const codeEndIndex = code.indexOf(codeDelimiter, codeStartIndex + codeDelimiter.length);

    const nameStartIndex = code.indexOf(nameDelimiter);
    const nameEndIndex = code.indexOf(nameDelimiter, nameStartIndex + nameDelimiter.length);

    if (codeStartIndex !== -1 && codeEndIndex !== -1) {
        let codeContent = code.substring(codeStartIndex + (codeDelimiter).length, codeEndIndex).trim();
        let filename = "behavior";

        if (nameStartIndex !== -1 && nameEndIndex !== -1) {
            filename = code.substring(nameStartIndex + (nameDelimiter).length, nameEndIndex).trim();
            codeContent = codeContent.replace('"' + filename + '"', '');
        }

        fs.writeFile(source + filename, codeContent, err => {
            if (err) {
                console.error('Error writing to file:', err);
            } else {
                console.log('Code content extracted and written to ' + filename + '.js');
            }
        });
    }
}

function chunkString(str, chunkSize) {
    const chunks = [];
    let currentChunk = '';

    // Split the string into words
    const words = str.split(/\s+/);

    // Process each word
    for (const word of words) {
        // If adding the current word exceeds the chunk size,
        // push the current chunk to the array and start a new chunk
        if ((currentChunk + ' ' + word).length > chunkSize) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
        }

        // Add the current word to the chunk
        currentChunk += (currentChunk === '' ? '' : ' ') + word;
    }

    // Push the last chunk to the array
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

async function runChat(bot, userPrompt) {
    if (userPrompt != null) {
        const result = (await chat.sendMessage(userPrompt)).response.text();

        // Update conversation history
        updateHistory(userPrompt, result);

        extractCodeToFile(result);
        console.log("User: " + userPrompt)
        console.log("Bot: " + chunkString(result, 256));
        bot.chat(result) //use max256 to print out each element of 256
    } else if (userPrompt == "Leave") {
        saveHistory(history, historyFile);
        process.exit(0);
    }
    runChat();
}

function loadHistory(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading history file:', err);
        return [];
    }
}

function saveHistory(history, filename) {
    try {
        const jsonData = JSON.stringify(history);
        fs.writeFileSync(filename, jsonData);
        console.log('Conversation history saved to ' + filename);
    } catch (err) {
        console.error('Error saving conversation history:', err);
    }
}

function updateHistory(userMessage, botMessage) {
    const newEntry = {
        role: "user",
        parts: userMessage
    };

    history.push(newEntry);

    const botReply = {
        role: "model",
        parts: botMessage
    };

    history.push(botReply);
}

// Run the chat
runChat(bot, null);

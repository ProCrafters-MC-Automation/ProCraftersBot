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

// Example usage:
const inputString = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const chunks = chunkString(inputString, 256);
console.log(chunks);

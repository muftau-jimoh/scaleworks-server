function splitStringedTextIntoChunks(text, chunkSize = 500) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let chunks = [];
    let chunk = "";

    for (const sentence of sentences) {
        if ((chunk + sentence).length > chunkSize) {
            chunks.push(chunk);
            chunk = sentence;
        } else {
            chunk += " " + sentence;
        }
    }

    if (chunk) chunks.push(chunk);
    return chunks;
}


function splitEDiscoveryTextIntoChunks(texts, chunkSize = 500) {
    let allChunks = [];

    for (const text of texts) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]; // Split into sentences
        let chunks = [];
        let chunk = "";

        for (const sentence of sentences) {
            if ((chunk + sentence).length > chunkSize) {
                chunks.push(chunk.trim()); // Store chunk
                chunk = sentence; // Start new chunk
            } else {
                chunk += " " + sentence;
            }
        }

        if (chunk) chunks.push(chunk.trim()); // Push last chunk
        allChunks.push(...chunks);
    }

    return allChunks;
}


module.exports = { splitStringedTextIntoChunks, splitEDiscoveryTextIntoChunks };

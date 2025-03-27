function chunkText(text, chunkSize = 500) {
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text]; // Improved regex to include sentence-ending punctuation
    let chunks = [];
    let chunk = "";

    for (const sentence of sentences) {
        const trimmedSentence = sentence.trim(); // Avoid extra spaces

        if ((chunk + " " + trimmedSentence).length > chunkSize) {
            chunks.push(chunk.trim()); // Push previous chunk
            chunk = trimmedSentence; // Start a new chunk
        } else {
            chunk += (chunk ? " " : "") + trimmedSentence; // Add sentence properly
        }
    }

    if (chunk) chunks.push(chunk.trim()); // Add any remaining text

    return chunks;
}

module.exports = chunkText;

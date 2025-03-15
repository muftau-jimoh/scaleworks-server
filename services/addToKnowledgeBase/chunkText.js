function chunkText(text, chunkSize = 500) {
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

module.exports = chunkText;

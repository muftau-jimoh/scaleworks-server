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

function splitEDiscoveryTextIntoChunks(texts, chunkSize = 700, overlap = 100) {
    const allChunks = [];
  
    for (const text of texts) {
      const words = text.split(" ");
      for (let i = 0; i < words.length; i += chunkSize - overlap) {
        const chunk = words.slice(i, i + chunkSize).join(" ");
        allChunks.push(chunk);
      }
    }
  
    return allChunks;
  }
  

module.exports = { splitStringedTextIntoChunks, splitEDiscoveryTextIntoChunks };

const { Pinecone } = require("@pinecone-database/pinecone");
const { getEmbeddingFromOpenAI } = require("../utils/getEmbedding");

require("dotenv").config();

const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexNameOne = process.env.PINECONE_INDEX_NAME_1;

// Initialize Pinecone
const pc = new Pinecone({ apiKey: pineconeApiKey });
const index = pc.index(pineconeIndexNameOne);




async function uploadToPinecone(username, chunks) {


  try {
    console.log(`🔍 Processing ${chunks.length} chunks for user: ${username}`);

    // Filter out empty chunks
    const validChunks = chunks.filter((chunk) => chunk.trim());
    if (validChunks.length === 0) {
      console.warn("⚠️ No valid chunks to process.");
      return;
    }

    const vectors = await Promise.all(
      validChunks.map(async (chunk, index) => {
        try {
          const embedding = await getEmbeddingFromOpenAI(chunk);
          if (!embedding) throw new Error("Embedding generation failed.");

          return {
            id: `${username}-${Date.now()}-${index}`, // Unique ID for each chunk
            values: embedding,
            metadata: { text: chunk },
          };
        } catch (error) {
          console.error(
            `❌ Error processing chunk ${index} for ${username}:`,
            error.message
          );
          return null; // Skip failed chunks
        }
      })
    );

    // Remove null values (failed embeddings)
    const validVectors = vectors.filter((v) => v !== null);

    if (validVectors.length > 0) {
        await index.namespace(username).upsert(validVectors);
      console.log(
        `✅ Uploaded ${validVectors.length} chunks successfully for ${username}`
      );
    } else {
      console.log("⚠️ No valid embeddings to upload.");
    }
    return { success: "successful" };
  } catch (error) {
    return {
      error: `Error uploading chunks: ${error.message}`,
    };
  }
}

module.exports = uploadToPinecone;

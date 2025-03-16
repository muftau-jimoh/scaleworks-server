const { getEmbeddingFromGithub } = require("./getEmbedding");
require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");

const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexNameTwo = process.env.PINECONE_INDEX_NAME_2;

// Initialize Pinecone
const pc = new Pinecone({ apiKey: pineconeApiKey });
const index = pc.index(pineconeIndexNameTwo);

/**
 * Stores document chunks temporarily in Pinecone
 */
async function storeChunksInPinecone(sessionId, chunks) {
    // console.log(`🚀 Processing ${chunks.length} chunks for session: ${sessionId}`);
  
    // Process each chunk safely
    const vectors = await Promise.allSettled(
      chunks.map(async (chunk, i) => {
        try {
          if (!chunk.trim()) {
            console.warn(`⚠️ Skipping empty chunk ${i}`);
            return null; // Skip processing empty chunks
          }
  
          // Replace with actual embedding function (e.g., OpenAI)
          const embedding = await getEmbeddingFromGithub(chunk);
          if (!embedding) throw new Error("Embedding generation failed.");
  
          const vectorId = `${sessionId}-chunk-${i}`;
          return {
            id: vectorId,
            values: embedding,
            metadata: { text: chunk, session: sessionId }, // Fix metadata reference
          };
        } catch (error) {
          console.error(`❌ Failed to process chunk ${i}:`, error.message);
          return null; // Return null to filter later
        }
      })
    );
  
    // Filter out failed embeddings
    const validVectors = vectors
      .filter((result) => result.status === "fulfilled" && result.value !== null)
      .map((result) => result.value);

    if (validVectors.length > 0) {
      await index.upsert(validVectors);
      const uploadedVectorIds = validVectors.map(vector => vector.id);
      console.log(`✅ Uploaded ${validVectors.length}/${chunks.length} chunks for session: ${sessionId}`);
      return uploadedVectorIds;  // Return vector IDs
    } else {
      console.log(`⚠️ No valid embeddings to upload for session: ${sessionId}`);
      return null;
    }
}

module.exports = storeChunksInPinecone;

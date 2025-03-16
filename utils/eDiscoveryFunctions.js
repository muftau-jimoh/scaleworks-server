const { getEmbeddingFromGithub } = require("./getEmbedding");
require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");

const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexNameTwo = process.env.PINECONE_INDEX_NAME_2;

// Initialize Pinecone
const pc = new Pinecone({ apiKey: pineconeApiKey });
const index = pc.index(pineconeIndexNameTwo);

/**
 * Finds relevant chunks for the given question
 */
async function findRelevantChunks(sessionId, query) {
  const queryEmbedding = await getEmbeddingFromGithub(query);

  const results = await index.query({
    vector: queryEmbedding,
    topK: 5, // Retrieve top 5 relevant chunks
    includeMetadata: true,
    filter: { session: sessionId }, // Only retrieve chunks from this session
  });

  return results.matches.map((match) => match.metadata.text);
}



/**
 * Deletes multiple vectors from Pinecone using their vector IDs.
 * @param {string[]} vectorIds - Array of vector IDs to delete.
 */
async function deleteVectors(vectorIds) {
  if (!Array.isArray(vectorIds) || vectorIds.length === 0) {
    console.warn("⚠️ No vector IDs provided for deletion.");
    return;
  }

  try {
    await index.deleteMany(vectorIds);
    console.log(`✅ Successfully deleted ${vectorIds.length} vectors.`);
  } catch (error) {
    console.error("❌ Failed to delete vectors:", error.message);
  }
}

module.exports = { findRelevantChunks, deleteVectors };

const { getEmbeddingFromOpenAI } = require("./getEmbedding");
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
async function searchPinecone(sessionId, query, topK = 5) {
  try {
    const queryEmbedding = await getEmbeddingFromOpenAI(query);

    const results = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: { session: sessionId },
    });

    return results.matches.map((match) => match.metadata.text);
  } catch (error) {
    console.error("Error during Pinecone search:", error);
    return [];
  }
}


async function findRelevantChunks(sessionId, query, retries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const results = await searchPinecone(sessionId, query);

    if (results.length > 0) return results;

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return [];
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

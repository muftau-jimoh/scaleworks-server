require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");
const { getEmbeddingFromGithub } = require("./getEmbedding");

const PINECONE_INDEX_NAME_1 = process.env.PINECONE_INDEX_NAME_1;
const pineconeApiKey = process.env.PINECONE_API_KEY;

// Initialize Pinecone
const pc = new Pinecone({ apiKey: pineconeApiKey });
const index = pc.index(PINECONE_INDEX_NAME_1);

/**
 * Perform vector search in Pinecone
 * @param {string} query - User's question
 * @returns {Promise<string>} - Relevant context from the knowledge base
 */
async function fetchRelevantContext(username, query) {
  const queryEmbedding = await getEmbeddingFromGithub(query);

  const results = await index.namespace(username).query({
    vector: queryEmbedding,
    topK: 5, // Retrieve top 5 relevant chunks
    includeMetadata: true,
  });

  return results.matches.map((match) => match.metadata.text);
}

module.exports = { fetchRelevantContext };

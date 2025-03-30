const { findRelevantChunks, deleteVectors } = require("../utils/eDiscoveryFunctions");

const OpenAI = require("openai");
require("dotenv").config();


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
}); 

/**
 * Streams data from OpenAI 
 * @param {string} relevantChunks - Relevant Document Content
 * @param {string} query - User's question
 * @param {function} onData - Callback for handling streamed data
 * @param {function} onError - Callback for handling errors
 * @returns {Promise<void>} Resolves when streaming is fully complete
 */ 

async function askAI(relevantChunks, query, onData, onError) {
  const context = relevantChunks.join("\n\n");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a document analyst. Answer the user's question using only the provided document content.",
        },
        { role: "user", content: `Relevant Document Content:\n${context}` },
        { role: "user", content: `Question: ${query}` },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices[0].delta?.content) {
        onData(chunk.choices[0]?.delta?.content || "");
      }
    }
  } catch (error) {
    if (onError) onError(error.message);
  }
}


// 📌 eDiscovery (Streaming)
async function callEDiscovery(sessionId, query, vectorIds, onData, onError) {
    if (!sessionId || !query) {
        onError("Session ID and query are required.");
        return;
    }

    const relevantChunks = await findRelevantChunks(sessionId, query);
    if (relevantChunks.length === 0) {
        onData("No relevant content found.");
        return;
    }

    await askAI(relevantChunks, query, onData, onError);  // ✅ Now ensures completion before cleanup
    await deleteVectors(vectorIds);  // ✅ Runs only after streaming fully ends
}



module.exports = callEDiscovery;

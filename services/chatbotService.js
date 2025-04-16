require("dotenv").config();
const { fetchRelevantContext } = require("../utils/chatBotModelFunctions");
const OpenAI = require("openai");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});


/**
 * Streams data from OpenAI
 * @param {string} relevantChunks - Relevant Document Content
 * @param {string} query - User's question
 * @param {function} onData - Callback for handling streamed data
 * @param {function} onError - Callback for handling errors
 * @returns {Promise<void>} Resolves when streaming is fully complete
 */

async function askAI(relevantContext, query, onData, onError) {
  const context = relevantContext.join("\n\n");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
    You are a 24/7 AI assistant.
    
    Your primary role is to assist users by answering questions based on the provided company knowledge base ("Context"). Always prioritize this context if it is relevant to the user’s query.
    
    If the context is not related to the question, or not provided, then rely on your general knowledge to assist the user appropriately. 
    
    Be helpful, concise, and clear in your responses.

    If you're answering based on the context, make it clear that your answer is based on internal company information.

    If you're answering based on general knowledge, respond naturally but avoid referencing company-specific content.
          `.trim(),
        },
        {
          role: "user",
          content: `Context:\n${context || "N/A"}\n\nUser Query: ${query}`,
        },
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

/**
 * Stream response from OpenAI GPT-4o-mini using retrieved context
 * @param {string} query - User's question
 * @param {function} onData - Callback to handle streamed data
 */
async function queryChatBotService(organization_name, query, onData, onError) {
  try {
    if (!query) {
      onError("Query is required.");
      return;
    }

    // Step 1: Fetch relevant context from Pinecone
    const relevantContext = await fetchRelevantContext(
      organization_name,
      query
    );

    await askAI(relevantContext, query, onData, onError);
  } catch (error) {
    console.error("OpenAI Streaming Error:", error);
    onError(error);
  }
}

/**
 * Streams data from GitHub Marketplace AI
 * @param {string[]} relevantContext - Relevant Document Content
 * @param {string} query - User's question
 * @param {function} onData - Callback for handling streamed data
 * @param {function} onError - Callback for handling errors
 * @returns {Promise<void>} Resolves when streaming is fully complete
 */

module.exports = queryChatBotService;

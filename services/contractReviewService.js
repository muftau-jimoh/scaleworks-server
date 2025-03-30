require("dotenv").config();
const OpenAI = require("openai");


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TOKENS = 7500; // Keep it under 8000 to be safe

/**
 * Streams contract analysis from OpenAI GPT-4o-mini
 * @param {string} contractText - The contract text to analyze
 * @param {function} onData - Callback for handling streamed data
 * @param {function} onError - Callback for handling errors
 */
async function callContractReviewService(contractText, onData, onError) {
  try {
    const contractChunks = splitText(contractText, MAX_TOKENS);

    for (const chunk of contractChunks) {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert contract analyst. Review the following contract(s) and provide:
              1. Key clauses and their meaning
              2. Potential legal risks
              3. Areas needing clarification`,
          },
          { role: "user", content: chunk },
        ],
        stream: true,
      });

      // Read the streaming response
      for await (const part of stream) {
        const content = part.choices?.[0]?.delta?.content || "";
        if (content) onData(content);
      }
    }
  } catch (error) {
    if (onError) onError(error.message || "Failed to process contract.");
  }
}




// Utility function to split text into chunks
function splitText(text, maxTokens) {
  const words = text.split(" ");
  const chunks = [];
  let currentChunk = [];

  for (let word of words) {
    if (currentChunk.join(" ").length + word.length > maxTokens) {
      chunks.push(currentChunk.join(" "));
      currentChunk = [];
    }
    currentChunk.push(word);
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}


module.exports = { callContractReviewService };

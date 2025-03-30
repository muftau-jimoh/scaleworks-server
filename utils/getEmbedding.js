const OpenAI = require("openai");
require("dotenv").config();


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RATE_LIMIT_RPM = 100; // Adjust based on OpenAI plan
const REQUEST_INTERVAL = (60 * 1000) / RATE_LIMIT_RPM; // Milliseconds per request

async function getEmbeddingFromOpenAI(text, maxRetries = 5) {
  if (!text || typeof text !== "string" || text.trim() === "") {
    throw new Error("Invalid input: Text must be a non-empty string.");
  }

  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
      });

      return response.data[0].embedding;
    } catch (error) {
      if (error.status === 429) {
        // Handle rate limit
        const resetTime = error.headers?.["x-ratelimit-reset"];
        const waitTime = resetTime
          ? resetTime * 1000 - Date.now()
          : REQUEST_INTERVAL;

        console.warn(
          `Rate limit hit. Retrying in ${waitTime / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        retries++;
      } else {
        console.error("Error fetching embedding:", error.message);
        throw error;
      }
    }
  }

  throw new Error("Exceeded maximum retries due to rate limits.");
}

module.exports = { getEmbeddingFromOpenAI };

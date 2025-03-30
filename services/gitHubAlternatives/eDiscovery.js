


/**
 * Streams data from GitHub Marketplace AI
 * @param {string[]} relevantChunks - Relevant Document Content
 * @param {string} query - User's question
 * @param {function} onData - Callback for handling streamed data
 * @param {function} onError - Callback for handling errors
 * @returns {Promise<void>} Resolves when streaming is fully complete
 */

async function askAIFromGitHub(relevantChunks, query, onData, onError) {
    const context = relevantChunks.join("\n\n");

    const client = new OpenAI({ 
        baseURL: "https://models.inference.ai.azure.com", 
        apiKey: process.env.GITHUB_TOKEN 
    });

    return new Promise(async (resolve, reject) => {  // ✅ Ensures streaming fully completes
        try {
            const stream = await client.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a document analyst. Answer the user's question using only the provided document content." },
                    { role: "user", content: `Relevant Document Content:\n${context}` },
                    { role: "user", content: `Question: ${query}` },
                ],
                model: "gpt-4o",
                stream: true,
                stream_options: { include_usage: true }
            });

            let usage = null;

            for await (const part of stream) {
                const text = part.choices[0]?.delta?.content || "";
                if (text) onData(text);  // ✅ Stream text as it arrives

                if (part.usage) usage = part.usage;
            }

            if (usage) {
                // console.log(`Prompt tokens: ${usage.prompt_tokens}`);
                // console.log(`Completion tokens: ${usage.completion_tokens}`);
                // console.log(`Total tokens: ${usage.total_tokens}`);
            }

            resolve();  // ✅ Ensures function completes successfully

        } catch (error) {
            onError(error.message);
            reject(error);  // ✅ Proper error handling
        }
    });
}


const githubToken = process.env.GITHUB_TOKEN;
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "text-embedding-3-small";

const client = new OpenAI({
  baseURL: endpoint,
  apiKey: githubToken,
});

const GITHUB_RPM = 15; // Free plan limit
const GITHUB_REQUEST_INTERVAL = (60 * 1000) / GITHUB_RPM; // 4000ms (4 sec) per request
const GITHUB_DAILY_LIMIT = 150; // Max requests per day for Free Plan

let requestCount = 0; // Track total requests for the day

async function getEmbeddingFromGithub(text, retries = 5) {
  if (!text || typeof text !== "string" || text.trim() === "") {
    throw new Error("Invalid input: Text must be a non-empty string.");
  }

  if (requestCount >= GITHUB_DAILY_LIMIT) {
    console.error("Daily request limit reached. Try again tomorrow.");
    return null;
  }

  let delay = GITHUB_REQUEST_INTERVAL; // Initial wait time

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await client.embeddings.create({
        input: [text], // GitHub requires an array
        model: modelName,
      });

      requestCount++; // Increase request count
      return response.data[0].embedding; // Extract embedding vector
    } catch (error) {
      if (error.status === 429) {
        // Extract GitHub rate limit reset time if available
        const resetTime = error.response?.headers?.["x-ratelimit-reset"];
        const waitTime = resetTime ? resetTime * 1000 - Date.now() : delay;

        console.warn(
          `Rate limit hit. Retrying in ${
            Math.max(waitTime, GITHUB_REQUEST_INTERVAL) / 1000
          } seconds...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(waitTime, GITHUB_REQUEST_INTERVAL))
        );

        delay *= 2; // Exponential backoff: 4s → 8s → 16s...
      } else {
        console.error("Error generating embedding:", error);
        return null; // Return null for non-rate-limit errors
      }
    }
  }

  console.error("Max retries reached. Could not generate embedding.");
  return null;
}

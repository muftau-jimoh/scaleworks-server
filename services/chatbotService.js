require("dotenv").config();
const fetch = require("node-fetch");
const { fetchRelevantContext } = require("../utils/chatBotModelFunctions");
const OpenAI = require("openai");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

  return new Promise(async (resolve, reject) => {
    // ✅ Ensure streaming completes before resolving
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are an AI assistant that answers questions based on provided knowledge base context.",
              },
              {
                role: "user",
                content: `Context:\n${context}\n\nUser Query: ${query}`,
              },
            ],
            stream: true, // Enable streaming
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep the last incomplete line

        for (let line of lines) {
          if (line.trim() === "data: [DONE]") {
            resolve(); // ✅ Ensure function resolves when streaming ends
            return;
          }

          if (line.startsWith("data: ")) {
            try {
              const jsonString = line.replace("data: ", "").trim();
              if (!jsonString) continue;

              const parsedData = JSON.parse(jsonString);
              if (parsedData.choices && parsedData.choices.length > 0) {
                onData(parsedData.choices[0].delta.content || ""); // Stream text as it arrives
              }
            } catch (err) {
              onError("Invalid JSON response from OpenAI");
            }
          }
        }
      }

      resolve(); // ✅ Ensure Promise resolves on completion
    } catch (error) {
      onError(error.message);
      reject(error); // ✅ Proper error handling
    }
  });
}




/**
 * Stream response from OpenAI GPT-4o-mini using retrieved context
 * @param {string} query - User's question
 * @param {function} onData - Callback to handle streamed data
 */
async function queryChatBotService(query, onData, onError) {
  try {
    if (!query) {
      onError("Query is required.");
      return;
    }

    // Step 1: Fetch relevant context from Pinecone
    const relevantContext = await fetchRelevantContext(query);

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

async function askAIFromGitHub(relevantContext, query, onData, onError) {
    const context = relevantContext.join("\n\n");

    const client = new OpenAI({ 
        baseURL: "https://models.inference.ai.azure.com", 
        apiKey: process.env.GITHUB_TOKEN 
    });

    return new Promise(async (resolve, reject) => {  // ✅ Ensures streaming fully completes
        try {
            const stream = await client.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an AI assistant that answers questions based on provided knowledge base context." },
                    { role: "user", content: `Context:\n${context}\n\nUser Query: ${query}` }
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



module.exports = queryChatBotService;

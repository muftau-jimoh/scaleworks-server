require("dotenv").config();
const OpenAI = require("openai");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
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
      const payload = {
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
      };

      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
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
        buffer = lines.pop() || ""; // Keep the last line in case it's incomplete

        for (let line of lines) {
          if (line.trim() === "data: [DONE]") return; // End of stream

          if (line.startsWith("data: ")) {
            try {
              const jsonString = line.replace("data: ", "").trim();
              if (!jsonString) continue;

              const parsedData = JSON.parse(jsonString);
              const content = parsedData.choices?.[0]?.delta?.content;
              if (content) onData(content);
            } catch (err) {
              if (onError) onError(`Invalid JSON: ${line}`);
            }
          }
        }
      }

      // Process any remaining buffer data after stream ends
      if (buffer.trim() && buffer.startsWith("data: ")) {
        try {
          const jsonString = buffer.replace("data: ", "").trim();
          const parsedData = JSON.parse(jsonString);
          const content = parsedData.choices?.[0]?.delta?.content;
          if (content) onData(content);
        } catch (err) {
          if (onError) onError(`Final buffer JSON parse error: ${buffer}`);
        }
      }
    }
  } catch (error) {
    if (onError) onError(error.message || "Failed to process contract.");
  }
}



const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o-mini";

async function callGithubModel(contractText, onData, onError) {
  try {
    const client = new OpenAI({ baseURL: endpoint, apiKey: GITHUB_TOKEN });

    const contractChunks = splitText(contractText, MAX_TOKENS);

    for (const chunk of contractChunks) {
      const stream = await client.chat.completions.create({
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
        model: modelName,
        stream: true,
        stream_options: { include_usage: true },
      });

      let buffer = "";
      let usage = null;

      for await (const part of stream) {
        const content = part.choices?.[0]?.delta?.content;
        if (content) {
          buffer += content;

          // Process only complete lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Store any incomplete line

          for (let line of lines) {
            onData(line);
          }
        }

        if (part.usage) {
          usage = part.usage;
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        onData(buffer);
      }

      // Log token usage if available
      // if (usage) {
      //   console.log(`Prompt tokens: ${usage.prompt_tokens}`);
      //   console.log(`Completion tokens: ${usage.completion_tokens}`);
      //   console.log(`Total tokens: ${usage.total_tokens}`);
      // }
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


module.exports = { callContractReviewService, callGithubModel };

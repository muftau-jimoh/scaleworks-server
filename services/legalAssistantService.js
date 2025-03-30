require("dotenv").config();
const OpenAI = require("openai");


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
});

/**
 * Streams response from OpenAI GPT-4o
 * @param {string} query - Legal question/query
 * @param {function} onData - Callback for streaming OpenAI response
 * @param {function} onError - Callback for handling errors
 */
async function callLegalAssistant(query, onData, onError) {
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a legal research assistant. Answer the following legal question thoroughly, citing relevant laws, precedents, and authoritative sources. If applicable, include notable court cases to support your answer. Ensure the response is well-structured, clear, and legally sound.",
        },
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




module.exports = { callLegalAssistant };

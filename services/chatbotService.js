const OpenAI = require("openai");

require("dotenv").config();
const fetch = require("node-fetch");
const { Pinecone } = require("@pinecone-database/pinecone");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_INDEX_NAME_1 = process.env.PINECONE_INDEX_NAME_1;

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

/**
 * Perform vector search in Pinecone
 * @param {string} query - User's question
 * @returns {Promise<string>} - Relevant context from the knowledge base
 */
async function fetchRelevantContext(query) {
    try {
        const index = pinecone.index(PINECONE_INDEX_NAME_1);
        const response = await index.query({
            vector: await getEmbeddingGithub(query), // Convert query to vector
            topK: 5, // Get top 5 most relevant results
            includeMetadata: true, // Fetch document metadata
        });

        return response.matches
            .map((match) => match.metadata.text)
            .join("\n\n"); // Combine retrieved context
    } catch (error) {
        console.error("Pinecone Query Error:", error);
        return ""; // Return empty context if error occurs
    }
}


/**
 * Convert text to embedding using OpenAI
 * @param {string} text - Input text to convert
 * @returns {Promise<number[]>} - Embedding vector
 */
async function getEmbeddingOpenAI(text) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            input: text,
            model: "text-embedding-3-small", // the embedding model
        }),
    });

    const data = await response.json();
    return data.data[0].embedding;
}


const githubToken = process.env.GITHUB_TOKEN;// GitHub Marketplace API Key
const endpoint = "https://models.inference.ai.azure.com"; // GitHub's OpenAI Endpoint
const modelName = "text-embedding-3-small"; // Embedding model

const client = new OpenAI({ baseURL: endpoint, apiKey: githubToken });

async function getEmbeddingGithub(text) {
    if (!text || typeof text !== "string" || text.trim() === "") {
        throw new TypeError("Invalid input: Text must be a non-empty string.");
    }

    try {
        const response = await client.embeddings.create({
            input: [`${text}`], // GitHub API requires an array of strings
            model: modelName,
        });

        return response.data[0].embedding; // Extract the embedding vector
    } catch (error) {
        console.error("❌ Error fetching embedding:", error.message);
        throw error;
    }
}


/**
 * Stream response from OpenAI GPT-4o-mini using retrieved context
 * @param {string} query - User's question
 * @param {function} onData - Callback to handle streamed data
 */
async function queryChatBotService(query, onData) {
    try {
        // Step 1: Fetch relevant context from Pinecone
        const context = await fetchRelevantContext(query);
        console.log('context; ', context)

        return context

        // Step 2: Send context + user query to OpenAI
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
                        content: "You are an AI assistant that answers questions based on provided knowledge base context.",
                    },
                    {
                        role: "user",
                        content: `Context:\n${context}\n\nUser Query: ${query}`,
                    },
                ],
                stream: true, // Enable streaming
            }),
        });

        // Step 3: Stream response to client
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // Process each data chunk
            chunk.split("\n").forEach((line) => {
                if (line.startsWith("data: ")) {
                    try {
                        const parsedData = JSON.parse(line.replace("data: ", ""));
                        if (parsedData.choices && parsedData.choices.length > 0) {
                            const text = parsedData.choices[0].delta?.content;
                            if (text) onData(text);
                        }
                    } catch (err) {
                        console.error("JSON Parse Error:", err);
                    }
                }
            });
        }
    } catch (error) {
        console.error("OpenAI Streaming Error:", error);
    }
}

module.exports = queryChatBotService;

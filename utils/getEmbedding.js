const OpenAI = require("openai");
require("dotenv").config();
const axios = require("axios");

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
                const waitTime = resetTime ? (resetTime * 1000) - Date.now() : delay;

                console.warn(`Rate limit hit. Retrying in ${Math.max(waitTime, GITHUB_REQUEST_INTERVAL) / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, Math.max(waitTime, GITHUB_REQUEST_INTERVAL)));

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




const openaiApiKey = process.env.OPENAI_API_KEY;

// Set your rate limit (Requests Per Minute)
const RATE_LIMIT_RPM = 100; // Change this based on your OpenAI plan
const REQUEST_INTERVAL = (60 * 1000) / RATE_LIMIT_RPM; // Wait time per request in milliseconds

async function getEmbeddingFromOpenAI(text, maxRetries = 5) {
    if (!text || typeof text !== "string" || text.trim() === "") {
        throw new Error("Invalid input: Text must be a non-empty string.");
    }

    let retries = 0;

    while (retries < maxRetries) {
        try {
            const response = await axios.post(
                "https://api.openai.com/v1/embeddings",
                {
                    model: "text-embedding-3-small", // Adjust based on needs
                    input: [text],
                },
                {
                    headers: { Authorization: `Bearer ${openaiApiKey}` },
                }
            );

            return response.data.data[0].embedding;
        } catch (error) {
            if (error.response && error.response.status === 429) {
                // Extract rate limit headers if available
                const resetTime = error.response.headers["x-ratelimit-reset"];
                const waitTime = resetTime ? (resetTime * 1000) - Date.now() : REQUEST_INTERVAL;

                console.warn(`Rate limit hit. Retrying in ${waitTime / 1000} seconds...`);
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


module.exports = { getEmbeddingFromOpenAI, getEmbeddingFromGithub };

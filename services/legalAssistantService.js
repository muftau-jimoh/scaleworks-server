require("dotenv").config();
const OpenAI = require("openai");
const fetch = require("node-fetch");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Make sure to set this in your .env file

const openAIStreamingURL = "https://api.openai.com/v1/chat/completions";

/**
 * Streams response from OpenAI GPT-4o
 * @param {string} apiUrl - OpenAI API URL
 * @param {object} data - Request payload
 * @param {function} onData - Callback for handling streamed data
 * @param {function} onError - Callback for handling errors
 */
async function callOpenAI(apiUrl, data, onData, onError) {
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Accept": "text/event-stream",
            },
            body: JSON.stringify(data),
        });

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
                if (line.trim() === "data: [DONE]") return;

                if (line.startsWith("data: ")) {
                    try {
                        const jsonString = line.replace("data: ", "").trim();
                        if (!jsonString) continue;

                        const parsedData = JSON.parse(jsonString);
                        if (parsedData.choices && parsedData.choices.length > 0) {
                            onData(parsedData.choices[0].delta.content || ""); // Stream text as it arrives
                        }
                    } catch (err) {
                        if (onError) onError("Invalid JSON response from OpenAI");
                    }
                }
            }
        }

    } catch (error) {
        if (onError) onError(error.message);
    }
}

/**
 * Calls OpenAI GPT-4o for legal research
 * @param {string} userId - User ID (optional, for tracking)
 * @param {string} query - Legal question/query
 * @param {function} onData - Callback for streaming OpenAI response
 * @param {function} onError - Callback for handling errors
 */
async function callLegalAssistant(query, onData, onError) {
    try {
        return await callOpenAI(
            openAIStreamingURL,
            {
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a legal assistant providing detailed and well-researched legal information. Your responses should be accurate, well-structured, and, where applicable, cite relevant legal principles or case law." },
                    { role: "user", content: query }
                  ],
                stream: true,
            },
            onData,
            onError
        );
    } catch (error) {
        if (onError) onError(error);
    }
}



const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ENDPOINT = "https://models.inference.ai.azure.com"; // GitHub's AI model inference endpoint
const MODEL_NAME = "gpt-4o-mini"; // GitHub Marketplace model

/**
 * Calls GitHub AI Marketplace's GPT-4o Mini for legal research
 * @param {string} query - Legal question/query
 * @param {function} onData - Callback for streaming OpenAI response
 * @param {function} onError - Callback for handling errors
 */
async function callGitHubLegalAssistant(query, onData, onError) {
    try {
        const client = new OpenAI({ baseURL: GITHUB_ENDPOINT, apiKey: GITHUB_TOKEN });

        const stream = await client.chat.completions.create({
            model: MODEL_NAME,
            messages: [
                { role: "system", content: "You are a legal assistant providing detailed and well-researched legal information. Your responses should be accurate, well-structured, and, where applicable, cite relevant legal principles or case law." },
                { role: "user", content: query }
            ],
            stream: true,
            stream_options: { include_usage: true } // Tracks token usage
        });

        let usage = null;
        for await (const part of stream) {
            onData(part.choices[0]?.delta?.content || ""); // Send streamed content
            if (part.usage) {
                usage = part.usage;
            }
        }

        if (usage) {
            console.log(`Prompt tokens: ${usage.prompt_tokens}`);
            console.log(`Completion tokens: ${usage.completion_tokens}`);
            console.log(`Total tokens: ${usage.total_tokens}`);
        }

    } catch (error) {
        if (onError) onError(`GitHub AI API Error: ${error.message}`);
    }
}

module.exports = { callLegalAssistant, callGitHubLegalAssistant };

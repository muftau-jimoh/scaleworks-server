const axios = require("axios");
require("dotenv").config();

const STACK_AI_API_TOKEN = process.env.STACK_AI_API_TOKEN;
const ORG_ID = process.env.STACK_AI_ORG_ID;
const LEGAL_ASSIST_FLOW_ID = process.env.STACK_AI_LEGAL_ASSIST_FLOW_ID;
const E_DISCOVERY_FLOW_ID = process.env.STACK_AI_E_DISCOVERY_FLOW_ID;
const ALWAYS_ON_CHATBOT_FLOW_ID = process.env.STACK_AI_ALWAYS_ON_CHATBOT_FLOW_ID;

const API_URLS = {
    legalAssistant: `https://www.stack-inference.com/stream_exported_flow?flow_id=${LEGAL_ASSIST_FLOW_ID}&org=${ORG_ID}`,
    eDiscovery: `https://www.stack-inference.com/stream_exported_flow?flow_id=${E_DISCOVERY_FLOW_ID}&org=${ORG_ID}`,
    alwayOnChatBot: `https://www.stack-inference.com/stream_exported_flow?flow_id=${ALWAYS_ON_CHATBOT_FLOW_ID}&org=${ORG_ID}`,
};

/**
 * Streams data from Stack AI
 * @param {string} apiUrl - Stack AI streaming API URL
 * @param {object} data - Request payload
 * @param {function} onData - Callback for handling streamed data
 */
async function callStackAI(apiUrl, data, onData) {
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${STACK_AI_API_TOKEN}`,
                "Accept": "text/event-stream",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

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
                        onData(parsedData);
                    } catch (err) {
                        console.error("JSON Parse Error:", err);
                    }
                }
            });
        }
    } catch (error) {
        console.error("Stack AI Streaming Error:", error);
        throw error;
    }
}

//  Legal Assistant (streaming)
async function callLegalAssistant(userId, query, onData) {
    return await callStackAI(API_URLS.legalAssistant, { "user_id": `${userId}`, "in-0": query }, onData);
}

// 📌 eDiscovery (Streaming)
async function callEDiscovery(userId, documentUrls, query, onData) {
    try {
        const requestData = {
            user_id: userId,
            "doc-0": documentUrls,
            "in-0": query,
        };

        const response = await axios.post(API_URLS.eDiscovery, requestData, {
            headers: {
                Authorization: `Bearer ${process.env.STACK_AI_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            responseType: "stream", // Enable streaming response
        });

        response.data.on("data", (chunk) => {
            onData(chunk.toString());
        });

        return;
    } catch (error) {
        console.error("eDiscovery API Error:", error.response?.data || error.message);
        throw new Error("Error calling Stack AI eDiscovery API");
    }
}


// 📌 Always-Available Chatbot (Streaming)
async function callChatbot(userId, question, onData) {
    // return await callStackAIStream(API_KEYS.chatbot, {
    //     "user_id": userId,
    //     "in-0": question
    // }, onData);
}

module.exports = {
    callLegalAssistant,
    callEDiscovery,
    callChatbot
};

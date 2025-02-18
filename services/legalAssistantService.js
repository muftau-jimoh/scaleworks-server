require("dotenv").config();

const STACK_AI_API_TOKEN = process.env.STACK_AI_API_TOKEN;
const ORG_ID = process.env.STACK_AI_ORG_ID;
const LEGAL_ASSIST_FLOW_ID = process.env.STACK_AI_LEGAL_ASSIST_FLOW_ID;

const legalAssistantStreamingURL = `https://www.stack-inference.com/stream_exported_flow?flow_id=${LEGAL_ASSIST_FLOW_ID}&org=${ORG_ID}`

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
    return await callStackAI(legalAssistantStreamingURL, { "user_id": `${userId}`, "in-0": query }, onData);
}


module.exports = callLegalAssistant
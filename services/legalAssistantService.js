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
 * @param {function} onError - Callback for handling error
 */

async function callStackAI(apiUrl, data, onData, onError) {
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

        let buffer = ""; // Store incomplete JSON parts

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            buffer += chunk; // Append new data to buffer
            const lines = buffer.split("\n"); // Split into lines
            buffer = lines.pop(); // Save the last part (might be incomplete)

            for (let line of lines) {

                // **Ignore `[DONE]` message**
                if (line.trim() === "data: [DONE]") {
                    // console.log("Stream finished.");
                    return; // Stop processing
                }

                if (line.startsWith("data: ")) {
                    try {
                        const jsonString = line.replace("data: ", "").trim();
                        if (!jsonString) continue; // Skip empty lines

                        const parsedData = JSON.parse(jsonString);
                        onData(parsedData);
                    } catch (err) {
                        // console.log('error line: ', line);
                        // console.error("JSON Parse Error:", err);
                        if (onError) onError("Invalid JSON response from server");
                    }
                }
            }
        }

        // **Process any remaining buffer data (if it's a valid JSON)**
        if (buffer.trim().startsWith("data: ") && buffer.trim() !== "data: [DONE]") {
            try {
                const jsonString = buffer.replace("data: ", "").trim();
                if (jsonString) {
                    const parsedData = JSON.parse(jsonString);
                    onData(parsedData);
                }
            } catch (err) {
                // console.log('error buffer: ', buffer);
                // console.error("JSON Parse Error:", err);
                if (onError) onError("Invalid JSON response from server");
            }
        }

    } catch (error) {
        // console.error("Stack AI Streaming Error:", error);
        if (onError) onError(error.message);
    }
}



//  Legal Assistant (streaming)
async function callLegalAssistant(userId, query, onData, onError) {
    try {
        return await callStackAI(
            legalAssistantStreamingURL,
            { "user_id": `${userId}`, "in-0": query },
            onData, 
            onError
        );
    } catch (error) {
        if (onError) onError(error); // Pass error to the handler
    }
}

module.exports = callLegalAssistant;
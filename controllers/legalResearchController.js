const { callLegalAssistant } = require("../services/stackAiService");

exports.performLegalResearch = async (req, res) => {
    try {
        const { query } = req.body;
        const userId = req.user?.id;

        if (!query) return res.status(400).json({ error: "Query is required" });

        // Set headers for SSE (Server-Sent Events)
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders(); // Ensure headers are sent immediately

        await callLegalAssistant(userId, query, (data) => {
            if (data["out-0"]) {
                res.write(`data: ${data["out-0"]}\n\n`);
            }
        });

        res.end(); // Close the connection when streaming ends
    } catch (error) {
        console.error("Streaming Error:", error);
        res.status(500).json({ error: error.message });
    }
};

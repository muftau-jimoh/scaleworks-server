const { callEDiscovery } = require("../services/stackAiService");
const { uploadToStackAI } = require("../utils/fileUpload");

exports.performEDiscovery = async (req, res) => {
    try {
        const { query } = req.body;
        const userId = req.user?.id;
        const files = req.files; // Get uploaded files

        if (!query || !files || files.length === 0) {
            return res.status(400).json({ error: "Query and at least one file are required" });
        }

        const flow_id = process.env.STACK_AI_E_DISCOVERY_FLOW_ID

        // Upload all files concurrently
        const uploadPromises = files.map((file) => uploadToStackAI(file, userId, flow_id));
        const documentUrls = await Promise.all(uploadPromises);

        if (!documentUrls || documentUrls.length === 0) {
            return res.status(500).json({ error: "File upload failed" });
        }

        // Set headers for streaming response
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders(); // Send headers immediately

        // Call eDiscovery with uploaded file URLs
        await callEDiscovery(userId, documentUrls, query, (data) => {
            res.write(`data: ${data}\n\n`); // Stream response in real-time
        });

        res.end(); // Close connection after streaming is done
    } catch (error) {
        console.error("Streaming Error:", error);
        res.status(500).json({ error: error.message });
    }
};


const callEDiscovery = require("../services/eDiscoveryService");
const { uploadToCloudinary } = require("../utils/fileUpload");

exports.performEDiscovery = async (req, res) => {
    try {
        const { query } = req.body;
        const userId = req.user?.id;
        const files = req.files; // Get uploaded files,

        if (!query || !files || files.length === 0) {
            return res.status(400).json({ error: "Query and at least one file are required" });
        }

        // Upload all files concurrently to Cloudinary
        const folder = 'scaleworks/eDiscovery'
        const uploadPromises = files.map((file) => uploadToCloudinary(file, folder));
        const documentUrls = await Promise.all(uploadPromises);

        if (!documentUrls || documentUrls.length === 0) {
            return res.status(500).json({ error: "File upload failed" });
        }

        console.log('doc: ', documentUrls)

        // Set headers for streaming response
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders(); // Send headers immediately

        // Call eDiscovery with uploaded file URLs
        await callEDiscovery(userId, documentUrls, query, (data) => {
            if (data["out-0"]) {
                res.write(`data: ${data["out-0"]}\n\n`);
            }
        });

        res.end(); // Close connection after streaming is done
    } catch (error) {
        // Send error response only once
        if (!res.headersSent) {
            res.status(500).json({ error: error?.message  || "Error streaming response. try again" });
        }
    }
};

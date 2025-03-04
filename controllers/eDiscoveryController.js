const callEDiscovery = require("../services/eDiscoveryService");
const { uploadToCloudinary } = require("../utils/fileUpload");

exports.performEDiscovery = async (req, res) => {
    try {
        const { query } = req.body;
        const userId = req.user?.id;
        const files = req.files; // Get uploaded files

        if (!query || !files || files.length === 0) {
            return res
                .status(400)
                .json({ error: "Query and at least one file are required" });
        }

        // 🔹 Upload all files concurrently to Cloudinary
        const folder = `scaleworks/${userId}/eDiscovery`
        const uploadPromises = files.map((file) =>
            uploadToCloudinary(file, folder)
        );
        const documentUrls = await Promise.all(uploadPromises);

        if (!documentUrls || documentUrls.length === 0) {
            return res.status(500).json({ error: "File upload failed" });
        }

        // 🔹 Start SSE response
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders(); // Send headers immediately

        let streamClosed = false; // Track stream status

        await callEDiscovery(
            userId,
            documentUrls,
            query,
            (data) => {
                if (streamClosed) return; // Avoid writing after stream is closed
                if (data["out-0"]) {
                    res.write(
                        `data: ${JSON.stringify({
                            type: "SUCCESS",
                            message: data["out-0"],
                        })}\n\n`
                    );
                }
            },
            (error) => {
                console.error("E Discovery Error:", error);
                if (streamClosed) return; // Avoid duplicate writes
                res.write(
                    `event: error\ndata: ${JSON.stringify({
                        type: "ERROR",
                        message: error,
                    })}\n\n`
                );
                res.end();
                streamClosed = true;
                return; // Stop further execution
            }
        );

        if (!streamClosed) {
            res.write(
                `data: ${JSON.stringify({
                    type: "END",
                    message: "Streaming complete",
                })}\n\n`
            );
            setTimeout(() => {
                res.end();
            }, 500);
        }
    } catch (error) {
        console.error("Streaming Error:", error);
        res.write(
            `event: error\ndata: ${JSON.stringify({
                type: "SERVER_ERROR",
                message: error.message,
            })}\n\n`
        );
        res.end();
    }
};

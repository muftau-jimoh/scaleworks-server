const fs = require('fs');
const path = require('path');
const callTranscriptionService = require('../services/transcriptionService');

/**
 * Transcribes the provided audio file using the Stack AI transcription service after converting it to base64.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
async function transcribeAudio(req, res) {
    const userId = req.user?.id;
    const file = req.file; // Get uploaded audio file

    // Check if file is uploaded
    if (!file) {
        return res.status(400).json({ error: "No audio file uploaded." });
    }

    try {
        // Convert the uploaded file to base64
        const filePath = path.join(__dirname, "../uploads/audio", file.filename);  // Make sure you have the correct path to the file
        const fileBuffer = fs.readFileSync(filePath);
        const base64Audio = fileBuffer.toString('base64');  // Convert buffer to base64

        // Set headers for SSE (Server-Sent Events)
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders(); // Ensure headers are sent immediately

        await callTranscriptionService(userId, base64Audio, (data) => {
            if (data["out-0"]) {
                res.write(`data: ${data["out-0"]}\n\n`);
            }
        });

        // End the response when transcription is done
        res.end();
    } catch (error) {
        console.error("Error in transcribing audio:", error);
        // Send error response only once
        if (!res.headersSent) {
            res.status(500).json({ error: error?.message || "An error occurred during transcription" });
        }
    }
}

module.exports = {
    transcribeAudio
};

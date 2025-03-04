const fs = require("fs");
const path = require("path");
const callTranscriptionService = require("../services/transcriptionService");

/**
 * Transcribes the provided audio file using the Stack AI transcription service after converting it to base64.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
async function transcribeAudio(req, res) {
  const userId = req.user?.id;
  const audio = req.file; // Get uploaded audio file

  // Check if file is uploaded
  if (!audio) {
    return res.status(400).json({ error: "No audio file uploaded." });
  }

  try {
    // Convert the uploaded file to base64
    const filePath = path.join(__dirname, "../uploads/audio", audio.filename); // Make sure you have the correct path to the file
    const fileBuffer = fs.readFileSync(filePath);
    const base64Audio = fileBuffer.toString("base64"); // Convert buffer to base64

    // Set headers for SSE (Server-Sent Events)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Ensure headers are sent immediately

    let streamClosed = false; // Track stream status

    await callTranscriptionService(
      userId,
      base64Audio,
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
        console.error("Transcription Error:", error);
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
}

module.exports = {
  transcribeAudio,
};

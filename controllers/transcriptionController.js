const fs = require("fs");
const path = require("path");
const callTranscriptionService = require("../services/transcriptionService");

/**
 * Transcribes the provided audio file using the Stack AI transcription service after converting it to base64.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
async function transcribeAudio(req, res) {
  const audio = req.file; 

  if (!audio) {
    return res.status(400).json({ error: "No audio file uploaded." });
  }

  try {
    const filePath = path.join(__dirname, "../uploads/audio", audio.filename); 

    // Set headers for SSE (Server-Sent Events)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); 

    let streamClosed = false; 

    await callTranscriptionService(
      filePath,
      (data) => {
        if (streamClosed) return; 
        if (data) {
          res.write(`data: ${JSON.stringify({ type: "SUCCESS", message: data })}\n\n`);
        }
      },
      (error) => {
        console.error("Transcription Error:", error);
        if (streamClosed) return; 
        res.write(`event: error\ndata: ${JSON.stringify({ type: "ERROR", message: error })}\n\n`);
        res.end();
        streamClosed = true;
        return; 
      }
    );

    // Now this will only execute **after** transcription is complete
    if (!streamClosed) {
      res.write(`data: ${JSON.stringify({ type: "END", message: "Streaming complete" })}\n\n`);
      setTimeout(() => {
        res.end();
      }, 500);
    }
  } catch (error) {
    console.error("Streaming Error:", error);
    res.write(`event: error\ndata: ${JSON.stringify({ type: "SERVER_ERROR", message: error.message })}\n\n`);
    res.end();
  }
}


module.exports = {
  transcribeAudio,
};

const callEDiscovery = require("../services/eDiscoveryService");
const { extractTextFromFiles } = require("../utils/extractTextFromFiles");
const { v4: uuidv4 } = require("uuid");
const { splitEDiscoveryTextIntoChunks } = require('../utils/splitTextIntoChunks')
const storeChunksInPinecone = require("../utils/storeChunksInPinecone");
const { deleteFilesSafely } = require("../utils/deleteFilesSafely");
const fs = require("fs");
const path = require("path");

exports.performEDiscovery = async (req, res) => {
  let files = [];

  try {
    const { query } = req.body;
    files = req.files;

    if (!query || !files || files.length === 0) {
      return res
        .status(400)
        .json({ error: "Query and at least one file are required" });
    }
    
    // ✅ Check if the number of files exceeds the limit (5)
    if (files.length > 5) {
      return res.status(400).json({ error: "You can only upload up to 5 files." });
    }

    // ✅ Check if all files exist
    for (const file of files) {
      const filePath = path.join(__dirname, "../uploads/file", file.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: `File not found: ${file.filename}` });
      }
    }

    const sessionId = uuidv4();

    // Step 1: Extract text
    const extractionResults = await extractTextFromFiles(files);

    
    const failedExtractions = extractionResults.filter((r) => r.status === "failed");
    const successfulTexts = extractionResults.filter((r) => r.status === "success").map((r) => r.text);

    if (failedExtractions.length > 0) {
      console.error("Some files failed:", failedExtractions);
    }

    // ✅ Stop if no text was successfully extracted
    if (successfulTexts.length === 0) {
      return res.status(400).json({ error: "Failed to extract text from all files." });
    }

    // Step 2: Split texts into chunks
    const chunks = splitEDiscoveryTextIntoChunks(successfulTexts);

    // Step 3: Store chunks in Pinecone
    const vectorIds = await storeChunksInPinecone(sessionId, chunks);
    if (!vectorIds) throw new Error("Failed to upload file chunks to PineCone");

    // 🔹 SSE response setup
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); 

    let streamClosed = false;

    // Step 4: Process query using extracted data
    try {
      await callEDiscovery(
        sessionId, query, vectorIds,
        (data) => {
          if (!streamClosed && data) {
            res.write(`data: ${JSON.stringify({ type: "SUCCESS", message: data })}\n\n`);
          }
        },
        (error) => {
          console.error("E Discovery Error:", error);
          if (!streamClosed) {
            res.write(`event: error\ndata: ${JSON.stringify({ type: "ERROR", message: error })}\n\n`);
            res.end();
            streamClosed = true;
          }
        }
      );
    } catch (err) {
      console.error("Unexpected callEDiscovery error:", err);
      if (!streamClosed) {
        res.write(`data: ${JSON.stringify({ type: "ERROR", message: "Unexpected processing error." })}\n\n`);
        res.end();
      }
    }

    // Notify about failed extractions
    if (failedExtractions.length > 0) {
      res.write(`data: ${JSON.stringify({ type: "WARNING", message: "Some files failed", details: failedExtractions })}\n\n`);
    }

    if (!streamClosed) {
      setTimeout(() => {
        res.write(
          `data: ${JSON.stringify({
            type: "END",
            message: "Streaming complete",
          })}\n\n`
        );
        streamClosed = true;
        res.end();
      }, 1000);
    }
  } catch (error) {
    console.error("Streaming Error:", error);
    res.write(`data: ${JSON.stringify({ type: "SERVER_ERROR", message: error.message })}\n\n`);
    res.end();
  } finally {
    // Ensure all uploaded files are deleted
    deleteFilesSafely(files)
  }
};

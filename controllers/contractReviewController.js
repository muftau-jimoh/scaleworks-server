const { extractTextFromFiles } = require("../utils/extractTextFromFiles");
const {
  callContractReviewService,
} = require("../services/contractReviewService");
const { deleteFilesSafely } = require("../utils/deleteFilesSafely");

exports.reviewContract = async (req, res) => {
  let files = []; // Declare outside try block

  try {
    files = req.files; // Assign inside try
    if (!files || files?.length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    // Extract text from contracts
    const extractionResults = await extractTextFromFiles(files);

    // Check if any extraction failed
    const failedExtractions = extractionResults.filter(
      (result) => result.status === "failed"
    );
    const successfulTexts = extractionResults
      .filter((result) => result.status === "success")
      .map((result) => result.text);

    if (failedExtractions.length > 0) {
      console.error("Some files failed to extract:", failedExtractions);
    }

    // Streaming response setup
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let streamClosed = false;

    // If at least one file succeeded, process it
    if (successfulTexts.length > 0) {
      await callContractReviewService(
        successfulTexts.join("\n\n"), // Combine extracted texts
        (data) => {
          if (streamClosed) return;
          res.write(
            `data: ${JSON.stringify({ type: "SUCCESS", message: data })}\n\n`
          );
        },
        (error) => {
          console.error("Contract Review Error:", error);
          if (streamClosed) return;
          res.write(
            `data: ${JSON.stringify({ type: "ERROR", message: error })}\n\n`
          );
          res.end();
          streamClosed = true;
        }
      );
    }

    // Inform about failed extractions
    if (failedExtractions.length > 0) {
      res.write(
        `data: ${JSON.stringify({
          type: "WARNING",
          message: "Some files failed to extract",
          details: failedExtractions,
        })}\n\n`
      );
    }

    
    if (!streamClosed) {
      setTimeout(() => {
        res.write(
          `data: ${JSON.stringify({
            type: "END",
            message: "Streaming complete",
          })}\n\n`
        );
        res.end();
      }, 1000);
    }
  } catch (error) {
    console.error("Streaming Error:", error);
    res.write(
      `data: ${JSON.stringify({
        type: "SERVER_ERROR",
        message: error.message,
      })}\n\n`
    );
    res.end();
  } finally {
    // Ensure all uploaded files are deleted
    deleteFilesSafely(files)
  }
};


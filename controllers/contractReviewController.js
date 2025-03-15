const { extractTextFromFiles } = require("../utils/extractTextFromFiles");
const { callContractReviewService, callGithubModel } = require("../services/contractReviewService");

exports.reviewContract = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    // Extract text from contracts
    const contractTexts = await extractTextFromFiles(files);

    // Streaming response setup
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let streamClosed = false;

    await callGithubModel(
      contractTexts.join("\n\n"), // Combine multiple contracts into one text
      (data) => {
        if (streamClosed) return;
        console.log('data: ', data)
        if (data) {
          res.write(
            `data: ${JSON.stringify({ type: "SUCCESS", message: data })}\n\n`
          );
        }
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

    if (!streamClosed) {
      res.write(
        `data: ${JSON.stringify({ type: "END", message: "Streaming complete" })}\n\n`
      );
      setTimeout(() => res.end(), 500);
    }
  } catch (error) {
    console.error("Streaming Error:", error);
    res.write(
      `data: ${JSON.stringify({ type: "SERVER_ERROR", message: error.message })}\n\n`
    );
    res.end();
  }
};

const {
  callLegalAssistant,
} = require("../services/legalAssistantService");

/**
 * Fetches case law from CourtListener with authentication and summarizes it using GPT-4.
 */
exports.performLegalResearch = async (req, res) => {
  try {
    const { query } = req.query;
    // const userId = req.user?.id;

    if (!query) {
      return res.status(400).json({ error: "Missing legal question." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let streamClosed = false;

    // Call GPT-4 with case law context
    await callLegalAssistant(
      query,
      (data) => {
        if (streamClosed) return;
        if (data) {
          res.write(
            `data: ${JSON.stringify({
              type: "SUCCESS",
              message: data,
            })}\n\n`
          );
        }
      },
      (error) => {
        console.error("Legal Assistant Error:", error);
        if (streamClosed) return;
        res.write(
          `event: error\ndata: ${JSON.stringify({
            type: "ERROR",
            message: error,
          })}\n\n`
        );
        res.end();
        streamClosed = true;
      }
    );

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
      `event: error\ndata: ${JSON.stringify({
        type: "SERVER_ERROR",
        message: error.message,
      })}\n\n`
    );
    res.end();
  }
};

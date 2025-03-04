const callLegalAssistant = require("../services/legalAssistantService");

exports.performLegalResearch = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user?.id;

    if (!query) {
      res.setHeader("Content-Type", "text/event-stream");
      res.write(
        `event: error\ndata: ${JSON.stringify({
          type: "BAD_REQUEST",
          message: "Query is required",
        })}\n\n`
      );
      return res.end(); // Ensure function exits
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let streamClosed = false; // Track stream status

    await callLegalAssistant(
      userId,
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
        console.error("Legal Assistant Error:", error);
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

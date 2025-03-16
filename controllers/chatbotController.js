const queryChatBotService = require("../services/chatbotService");

async function chatWithBot(req, res) {
  const userId = req.user?.id;
  const { query } = req.body; // Get uploaded audio file

  // Check if file is uploaded
  if (!query) {
    return res.status(400).json({ error: "A query is required." });
  }

  try {
    // Set headers for SSE (Server-Sent Events)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Ensure headers are sent immediately

    let streamClosed = false; // Track stream status

    await queryChatBotService(
      query,
      (data) => {
        if (!streamClosed && data) {
          console.log('data: ', data)
          res.write(
            `data: ${JSON.stringify({ type: "SUCCESS", message: data })}\n\n`
          );
        }
      },
      (error) => {
        console.error("ChatBot Error:", error);
        if (!streamClosed) {
          res.write(
            `event: error\ndata: ${JSON.stringify({
              type: "ERROR",
              message: error,
            })}\n\n`
          );
          res.end();
          streamClosed = true;
        }
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

module.exports = chatWithBot;

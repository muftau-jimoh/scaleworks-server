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

    
    await queryChatBotService(query, (streamedText) => {
      if (streamedText) {
        console.log('streamedText: ', streamedText)
        res.write(`data: ${streamedText}\n\n`);
      }
    });

    // End the response when transcription is done
    res.end();
  } catch (error) {
    console.error("Error in fetching response to your query:", error);
    // Send error response only once
    if (!res.headersSent) {
      res.status(500).json({
        error:
          error?.message ||
          "An error occurred while fetching response to your query",
      });
    }
  }
};

module.exports = chatWithBot;

const supabase = require("../config/supabaseClient");
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


/**
 * fetches the 50 most recent messages in this model
 */
exports.fetchRecentLAChats = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query parameter." });
    }

   // Fetch the latest 50 chats for this user, ordered by the `time` field descending
   let { data: chats, error } = await supabase
   .from('la_chats')          // or your actual table name
   .select('*')
   .eq('userId', userId)      // match on your userId column
   .order('time', {           // order by the frontend-supplied `time`
     ascending: false
   })
   .limit(50);

    if (error) {
      console.error("Supabase fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch recent chats." });
    }

    // Reverse so the oldest of the 50 comes first
    chats = chats.reverse();

    res.status(200).json({ chats });
  } catch (err) {
    console.error("Controller error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};


/**
 * POST /legal-research/batch-save-chats
 * Body: { chats: Array< { ... } > }
 */
exports.batchSaveChats = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate payload
    const { chats } = req.body;
    if (!Array.isArray(chats) || chats.length === 0) {
      return res.status(400).json({ error: "No chats provided for batch save." });
    }

    // Build rows with userId
    const rows = chats.map((chat) => ({
      userId: user.id,           // your column name for user
      message: chat.message,
      sender: chat.sender,
      status: chat.status,
      time: chat.time,            // store the frontend timestamp
    }));

    // Insert in one batch
    const { error } = await supabase
      .from("la_chats")   
      .insert(rows);

    if (error) {
      console.error("Supabase batch insert error:", error);
      return res.status(500).json({ error: "Failed to save chats." });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("batchSaveChats controller error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

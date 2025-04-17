const { extractTextFromFiles } = require("../utils/extractTextFromFiles");
const {
  callContractReviewService,
  callContractReviewAssistant,
} = require("../services/contractReviewService");
const { deleteFilesSafely } = require("../utils/deleteFilesSafely");
const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabaseClient");

exports.reviewContract = async (req, res) => {
  let files = []; // Declare outside try block

  try {
    files = req.files; // Assign inside try
    if (!files || files?.length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    
    // ✅ Check if the number of files exceeds the limit (3)
    if (files.length > 3) {
      return res.status(400).json({ error: "You can only upload up to 3 files." });
    }

    // ✅ Check if all files exist
    for (const file of files) {
      const filePath = path.join(__dirname, "../uploads/file", file.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: `File not found: ${file.filename}` });
      }
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


exports.performContractReviewTask = async (req, res) => {
  try {
    const { reviewText, task } = req.body;
    // const userId = req.user?.id;

    if (!reviewText || !task) {
      return res.status(400).json({ error: "Incomplete request parameters." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let streamClosed = false;

    
    await callContractReviewAssistant(
      reviewText,
      task,
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
        console.error("Contract Review assistant Error:", error);
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
exports.fetchRecentCRChats = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query parameter." });
    }

    // Fetch the latest 50 chats for this user, ordered by the `time` field descending
    let { data: chats, error } = await supabase
      .from("cr_chats") // or your actual table name
      .select("*")
      .eq("userId", userId) // match on your userId column
      .order("time", {
        // order by the frontend-supplied `time`
        ascending: false,
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
exports.batchSaveCRChats = async (req, res) => {
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
      message: chat.message || null,
      sender: chat.sender,
      status: chat.status,
      time: chat.time,            // store the frontend timestamp
      fileNames: chat.fileNames || null,
    }));

    // Insert in one batch
    const { error } = await supabase
      .from("cr_chats")
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


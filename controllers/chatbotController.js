const queryChatBotService = require("../services/chatbotService");
const chunkText = require("../services/chunkText");
const { uploadToPinecone, deleteVectorsFromPinecone, removeKbIdFromUserProfile} = require("../services/uploadToPinecone");
const { extractTextFromFile } = require("../utils/extractTextFromFiles");
const supabase = require("../config/supabaseClient");
const { deleteFilesSafely } = require("../utils/deleteFilesSafely");
const fs = require("fs");
const path = require("path");
const { addDocumentToUserKnowledgeBase } = require("../services/knowledgeBaseService");

async function chatWithBot(req, res) {
  const organization_name = req.user?.organization_name;
  const { query } = req.query; // Get uploaded audio file

  if (!query) {
    return res.status(400).json({ error: "A query is required." });
  }

  if (!organization_name) {
    return res.status(400).json({ error: "Organization name is required." });
  }

  try {
    // Set headers for SSE (Server-Sent Events)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Ensure headers are sent immediately

    let streamClosed = false; // Track stream status

    await queryChatBotService(
      organization_name,
      query,
      (data) => {
        if (!streamClosed && data) {
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
}


async function uploadToKnowledgeBase(req, res) {
  let files = [];

  try {
    const { id: userId, organization_name } = req.user;
    files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    if (!organization_name) {
      return res.status(400).json({ error: "Organization name is required." });
    }

    // ✅ Check all files exist
    for (const file of files) {
      const filePath = path.join(__dirname, "../uploads/file", file.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: `File not found: ${file.filename}` });
      }
    }

    let errors = [];
    let updatedUser = null;

    for (const file of files) {
      try {
        const extractedText = await extractTextFromFile(file);
        if (!extractedText) {
          errors.push(`Failed to extract text from ${file.originalname}`);
          continue;
        }

        const chunks = chunkText(extractedText, 500);

        if (chunks.length === 0) {
          errors.push(`No chunks extracted from ${file.originalname}`);
          continue;
        }

        // Upload this file’s chunks to Pinecone
        const uploadRes = await uploadToPinecone(organization_name, chunks);
        if (!uploadRes?.success) {
          errors.push(`Pinecone upload failed for ${file.originalname}`);
          continue;
        }

        const vectorIds = uploadRes.vectorIds;

        // Add to user’s knowledge base (reusable helper)
        updatedUser = await addDocumentToUserKnowledgeBase(
          userId,
          file.originalname,
          vectorIds,
          supabase
        );
      } catch (err) {
        console.error(`Error processing ${file.originalname}:`, err);
        errors.push(`Error with ${file.originalname}: ${err.message}`);
      }
    }

    if (!updatedUser) {
      return res.status(500).json({
        error: "Failed to process any files",
        errors,
      });
    }

    return res.status(200).json({
      updatedUser,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error." });
  } finally {
    deleteFilesSafely(files);
  }
}


async function fetchKnowledgeBase(req, res) {
  try {
    const { knowledgeBaseIds } = req.body;

    if (!Array.isArray(knowledgeBaseIds) || knowledgeBaseIds.length === 0) {
      return res.status(400).json({ error: "knowledgeBaseIds must be a non-empty array." });
    }

    const { data, error } = await supabase
      .from("knowledgeBase")
      .select("*")
      .in("id", knowledgeBaseIds);

    if (error) {
      console.error("❌ Supabase Fetch Error:", error);
      return res.status(500).json({ error: "Failed to fetch knowledge base records." });
    }

    return res.status(200).json({ knowledgeBases: data });
  } catch (error) {
    console.error("❌ Controller Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}


async function deleteKnowledgeBase(req, res) {
  try {
    const { user } = req;
    const { organization_name } = user;
    const { knowledgeBaseId } = req.body;

    if (!knowledgeBaseId) {
      return res.status(400).json({ error: "knowledgeBaseId is required" });
    }

    // Step 1: Fetch KB record
    const { data: kbRecord, error: fetchError } = await supabase
      .from("knowledgeBase")
      .select("id, file_name, vector_ids")
      .eq("id", knowledgeBaseId)
      .single();

    if (fetchError || !kbRecord) {
      return res.status(404).json({ error: "Knowledge base not found" });
    }

    const vectorIds = kbRecord.vector_ids;

    // Step 2: Delete vectors from Pinecone
    const deleteVectorsRes = await deleteVectorsFromPinecone(organization_name, vectorIds);
    if (!deleteVectorsRes?.success) {
      return res.status(500).json({ error: "Failed to delete vectors from Pinecone" });
    }

    // Step 3: Remove KB ID from user's profile
    const { error: updateProfileError } = await removeKbIdFromUserProfile(user.id, knowledgeBaseId);
    if (updateProfileError) {
      return res.status(500).json({ error: updateProfileError.message });
    }

    // Step 4: Delete the knowledgeBase record
    const { error: deleteKbError } = await supabase
      .from("knowledgeBase")
      .delete()
      .eq("id", knowledgeBaseId);

    if (deleteKbError) {
      return res.status(500).json({ error: "Failed to delete knowledge base record" });
    }

    return res.status(200).json({ message: "Knowledge base deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}


/**
 * fetches the 50 most recent messages in this model
 */
async function fetchRecentCBAChats(req, res) {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query parameter." });
    }

   // Fetch the latest 50 chats for this user, ordered by the `time` field descending
   let { data: chats, error } = await supabase
   .from('chatbot_chats')          // or your actual table name
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
async function batchSaveCBAChats(req, res) {
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
      .from("chatbot_chats")   
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


module.exports = { chatWithBot, uploadToKnowledgeBase, fetchKnowledgeBase, deleteKnowledgeBase, fetchRecentCBAChats, batchSaveCBAChats };

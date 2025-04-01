const queryChatBotService = require("../services/chatbotService");
const chunkText = require("../services/chunkText");
const uploadToPinecone = require("../services/uploadToPinecone");
const { extractTextFromFile } = require("../utils/extractTextFromFiles");
const supabase = require("../config/supabaseClient");
const { deleteFilesSafely } = require("../utils/deleteFilesSafely");


async function chatWithBot(req, res) {
  const organization_name = req.user?.organization_name;
  const { query } = req.body; // Get uploaded audio file

  // Check if file is uploaded
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
          console.log("data: ", data);
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

    let allChunks = [];
    let errors = [];
    let uploadedFileNames = [];

    for (const file of files) {
      try {
        const extractedText = await extractTextFromFile(file);
        if (!extractedText) {
          errors.push(`Failed to extract text from ${file.originalname}`);
          continue;
        }

        uploadedFileNames.push(file.originalname);

        // Split text into chunks
        const chunks = chunkText(extractedText, 500);
        allChunks.push(...chunks);
      } catch (err) {
        console.error(`Error processing ${file.originalname}:`, err);
        errors.push(`Error processing ${file.originalname}: ${err.message}`);
      }
    }

    // Upload to Pinecone if there are valid chunks
    if (allChunks.length > 0) {
      const uploadRes = await uploadToPinecone(organization_name, allChunks);
      if (uploadRes?.error) {
        console.error("❌ Pinecone Upload Error:", uploadRes?.error);
        return res.status(500).json({
          message: "Failed to upload data to Pinecone.",
        });
      }
    }

    // Update user's knowledgeBase in Supabase
    const { data, error } = await supabase
      .from("profiles")
      .select("knowledgeBase")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // Ignore the error if the column is empty
      console.error("❌ Supabase Fetch Error:", error);
      return res.status(500).json({ error: "Failed to retrieve user data." });
    }

    const existingFiles = data?.knowledgeBase || [];
    const updatedFiles = [...new Set([...existingFiles, ...uploadedFileNames])]; // Avoid duplicates

    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update({ knowledgeBase: updatedFiles })
      .eq("id", userId)
      .select("*") // Fetch the updated user data
      .maybeSingle(); // Prevents error if no rows are updated

    if (updateError) {
      console.error("❌ Supabase Update Error:", updateError);
      return res.status(500).json({ error: "Failed to update user data." });
    }

    return res.status(200).json({
      updatedUser: updatedUser,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Internal Server Error." });
  } finally {
    // Ensure all uploaded files are deleted
    deleteFilesSafely(files)
  }
}


module.exports = { chatWithBot, uploadToKnowledgeBase };

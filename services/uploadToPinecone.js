const { Pinecone } = require("@pinecone-database/pinecone");
const { getEmbeddingFromOpenAI } = require("../utils/getEmbedding");
const supabase = require("../config/supabaseClient");

require("dotenv").config();

const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexNameOne = process.env.PINECONE_INDEX_NAME_1;

// Initialize Pinecone
const pc = new Pinecone({ apiKey: pineconeApiKey });
const index = pc.index(pineconeIndexNameOne);


async function uploadToPinecone(username, chunks) {
  try {
    console.log(`🔍 Processing ${chunks.length} chunks for user: ${username}`);

    // Filter out empty chunks
    const validChunks = chunks.filter((chunk) => chunk.trim());
    if (validChunks.length === 0) {
      console.warn("⚠️ No valid chunks to process.");
      return { success: false, message: "No valid chunks to process." };
    }

    const vectors = await Promise.all(
      validChunks.map(async (chunk, index) => {
        try {
          const embedding = await getEmbeddingFromOpenAI(chunk);
          if (!embedding) throw new Error("Embedding generation failed.");

          return {
            id: `${username}-${Date.now()}-${index}`, // Unique ID for each chunk
            values: embedding,
            metadata: { text: chunk },
          };
        } catch (error) {
          console.error(
            `❌ Error processing chunk ${index} for ${username}:`,
            error.message
          );
          return null; // Skip failed chunks
        }
      })
    );

    // Remove null values (failed embeddings)
    const validVectors = vectors.filter((v) => v !== null);

    if (validVectors.length > 0) {
      await index.namespace(username).upsert(validVectors);
      console.log(
        `✅ Uploaded ${validVectors.length} chunks successfully for ${username}`
      );

      // ✅ Return the vector IDs
      const vectorIds = validVectors.map((v) => v.id);
      return {
        success: true,
        message: `Uploaded ${validVectors.length} vectors.`,
        vectorIds,
      };
    } else {
      return {
        success: false,
        message: "No valid vectors to upload.",
        vectorIds: [],
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Error uploading chunks: ${error.message}`,
      vectorIds: [],
    };
  }
}

const deleteVectorsFromPinecone = async (username, vectorIds) => {
  if (!Array.isArray(vectorIds) || vectorIds.length === 0) {
    console.warn("⚠️ No vector IDs provided for deletion.");
    return { success: false, message: "No vector IDs provided." };
  }

  try {
    const response = await index.namespace(username).deleteMany(vectorIds);
    console.log(`✅ Successfully deleted ${vectorIds.length} vectors from ${username}'s namespace.`);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Error deleting vectors from Pinecone:", error.message);
    return { success: false, message: error.message };
  }
};


const removeKbIdFromUserProfile = async (userId, kbIdToRemove) => {
  const { data: user, error: fetchError } = await supabase
    .from("profiles")
    .select("knowledgeBase")
    .eq("id", userId)
    .single();

  if (fetchError) {
    return { error: fetchError };
  }

  const currentKbIds = user?.knowledgeBase || [];
  const updatedKbIds = currentKbIds.filter(id => id !== kbIdToRemove);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ knowledgeBase: updatedKbIds })
    .eq("id", userId);

  return { error: updateError || null };
};




module.exports = { uploadToPinecone, deleteVectorsFromPinecone, removeKbIdFromUserProfile};

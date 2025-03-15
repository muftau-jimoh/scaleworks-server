require("dotenv").config();

const { Pinecone } = require("@pinecone-database/pinecone");
const extractTextFromPDFs = require("./extractText");
const chunkText = require("./chunkText");
const { getEmbeddingFromGithub } = require("./getEmbedding");

const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX_NAME;

// Initialize Pinecone
const pc = new Pinecone({ apiKey: pineconeApiKey });
const index = pc.index(pineconeIndexName);

async function uploadDocuments(folderPath) {
    console.log("📂 Extracting text from PDFs in:", folderPath);

    const documents = await extractTextFromPDFs(folderPath);
    if (!documents.length) {
        console.log("❌ No documents found!");
        return;
    }

    for (const { fileName, text } of documents) {
        console.log(`🔍 Processing ${fileName}...`);
        const chunks = chunkText(text);

        // Handle errors for each chunk without stopping execution
        const vectors = await Promise.all(
            chunks.map(async (chunk, i) => {
                try {
                    if (!chunk.trim()) {
                        console.warn(`⚠️ Skipping empty chunk ${i} from ${fileName}`);
                        return null; // Skip processing empty chunks
                    }
        
                    const embedding = await getEmbeddingFromGithub(chunk);
                    if (!embedding) throw new Error("Embedding generation failed.");
        
                    return {
                        id: `${fileName}-${i}`,
                        values: embedding,
                        metadata: { text: chunk, source: fileName },
                    };
                } catch (error) {
                    console.error(`❌ Failed to process chunk ${i} of ${fileName}:`, error.message);
                    return null; // Return null to filter later
                }
            })
        );
        
        // Filter out failed embeddings before uploading
        const validVectors = vectors.filter(v => v !== null);
        if (validVectors.length > 0) {
            await index.upsert(validVectors);
            console.log(`✅ Uploaded ${validVectors.length} chunks from ${fileName}`);
        } else {
            console.log(`⚠️ No valid embeddings for ${fileName}, skipping upload.`);
        }
    }

    console.log("🚀 Document upload completed!");
}

// Start the process
uploadDocuments("assets/chatbot_knowledgebase");

const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const deepgram = createClient(deepgramApiKey);

/**
 * Streams an audio file to Deepgram for real-time transcription.
 * @param {string} filePath - Path to the audio file.
 * @param {function} onData - Callback for handling transcription data.
 * @param {function} onError - Callback for handling errors.
 */
const callTranscriptionService = (filePath, onData, onError) => {
  return new Promise((resolve, reject) => {
    try {
      const live = deepgram.listen.live({
        model: "nova-3",
        language: "en-US",
        smart_format: true,
        punctuate: true,
        interim_results: true,
      });

      live.on(LiveTranscriptionEvents.Open, () => {
        console.log("🔊 Connection to Deepgram opened. Streaming audio...");

        const readStream = fs.createReadStream(filePath, {
          highWaterMark: 4096,
        });

        readStream.on("data", (chunk) => {
          live.send(chunk);
        });

        readStream.on("end", () => {
          // console.log("✅ Finished reading file. Closing connection...");
          live.requestClose(); // Close after reading
        });
      });

      live.on(LiveTranscriptionEvents.Transcript, (data) => {
        if (data?.is_final && data?.channel?.alternatives[0]?.transcript) {
          onData(data.channel.alternatives[0].transcript);
        }
      });

      live.on(LiveTranscriptionEvents.Error, (error) => {
        // console.error("❌ Deepgram Error:", error);
        onError(error);
        reject(error);
      });

      live.on(LiveTranscriptionEvents.Close, () => {
        // console.log("🔴 Connection closed.");

        // Delete the file after successful transcription
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`⚠️ Failed to delete file: ${err}`);
          } else {
            console.log(`🗑️ Successfully deleted ${filePath}`);
          }
        });

        resolve();
      });

      // Timeout fallback
      setTimeout(() => {
        // console.log("⌛ Timeout reached. Closing connection...");
        live.requestClose();
      }, 5000);
    } catch (error) {
      console.error("❌ Failed to stream transcription:", error);
      onError(error);
      reject(error);
    }
  });
};


const OpenAI = require("openai");


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
});

/**
 * Streams response from OpenAI GPT-4o
 * @param {string} transcriptText - transcription of audio
 * @param {string} task - user query/task
 * @param {function} onData - Callback for streaming OpenAI response
 * @param {function} onError - Callback for handling errors
 */
const callTranscriptAssistant = async (
  transcriptText,
  task,
  onData,
  onError
) => {
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
        You are an AI assistant that helps users understand or analyze audio transcriptions. 
        Always base your response entirely on the transcription provided by the user. 
        If asked for summaries, insights, legal implications, or other tasks, make sure your answers are accurate, clear, and grounded in the transcript.
        `,
        },
        {
          role: "user",
          content: `
    You are given an audio transcription:
    
    \`\`\`
    ${transcriptText}
    \`\`\`
    
    Task:
    ${task}
    
    Please use only the transcription to perform the task accurately and provide a clear, helpful response.`,
        },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices[0].delta?.content) {
        onData(chunk.choices[0]?.delta?.content || "");
      }
    }
  } catch (error) {
    if (onError) onError(error.message);
  }
};

module.exports = { callTranscriptionService, callTranscriptAssistant};

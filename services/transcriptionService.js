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

        const readStream = fs.createReadStream(filePath, { highWaterMark: 4096 });

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


module.exports = callTranscriptionService;

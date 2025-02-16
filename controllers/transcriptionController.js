const { callStackAI } = require("../services/stackAiService");

exports.transcribeAudio = async (req, res) => {
    try {
        const { audioFile } = req.body;
        if (!audioFile) return res.status(400).json({ error: "Audio file is required" });

        const response = await callStackAI("transcription", { audioFile });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

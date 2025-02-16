const { callStackAI } = require("../services/stackAiService");

exports.automateDocument = async (req, res) => {
    try {
        const { documentData } = req.body;
        if (!documentData) return res.status(400).json({ error: "Document data is required" });

        const response = await callStackAI("document-automation", { documentData });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

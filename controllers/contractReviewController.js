const { callStackAI } = require("../services/stackAiService");

exports.reviewContract = async (req, res) => {
    try {
        const { contractText } = req.body;
        if (!contractText) return res.status(400).json({ error: "Contract text is required" });

        const response = await callStackAI("contract-review", { contractText });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

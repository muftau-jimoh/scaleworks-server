const callChatbot = require("../services/chatbotService");


exports.chatWithBot = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        const response = await callChatbot("chatbot", { message });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

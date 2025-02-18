require("dotenv").config();

const STACK_AI_API_TOKEN = process.env.STACK_AI_API_TOKEN;
const ORG_ID = process.env.STACK_AI_ORG_ID;
const ALWAYS_ON_CHATBOT_FLOW_ID = process.env.STACK_AI_ALWAYS_ON_CHATBOT_FLOW_ID;

const API_URLS = {
    alwayOnChatBot: `https://www.stack-inference.com/stream_exported_flow?flow_id=${ALWAYS_ON_CHATBOT_FLOW_ID}&org=${ORG_ID}`,
};


// 📌 Always-Available Chatbot (Streaming)
async function callChatbot(userId, question, onData) {
    // return await callStackAIStream(API_KEYS.chatbot, {
    //     "user_id": userId,
    //     "in-0": question
    // }, onData);
}


module.exports = callChatbot
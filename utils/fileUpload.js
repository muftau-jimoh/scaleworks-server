const fs = require("fs");
// const fetch = require("node-fetch");
const FormData = require("form-data");

require("dotenv").config();

async function uploadToStackAI(file, userId, flow_id) {
    try {

        const fetch = (await import("node-fetch")).default; // Dynamically import node-fetch

        const fileStream = fs.createReadStream(file.path);
        const formData = new FormData();
        formData.append("file", fileStream);

        // Construct the Stack AI upload URL
        const stackAIUrl = `https://api.stack-ai.com/documents/${process.env.STACK_AI_ORG_ID}/${flow_id}/doc-0/${userId}`;

        const response = await fetch(stackAIUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.STACK_AI_API_TOKEN}`,
            },
            body: formData,
        });

        console.log('response: ', response)

        const data = await response.json();
        
        console.log('data: ', data)

        if (!response.ok) {
            throw new Error(data.error || "File upload to Stack AI failed");
        }

        throw new Error("File upload to Stack AI failed - scam");

        // return data.file_url; // Return uploaded file URL
    } catch (error) {
        console.error("Stack AI File Upload Error:", error.message);
        throw new Error("File upload to Stack AI failed");
    }
}

module.exports = { uploadToStackAI };

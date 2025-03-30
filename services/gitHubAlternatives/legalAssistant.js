


const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ENDPOINT = "https://models.inference.ai.azure.com"; // GitHub's AI model inference endpoint
const MODEL_NAME = "gpt-4o-mini"; // GitHub Marketplace model

/**
 * Calls GitHub AI Marketplace's GPT-4o Mini for legal research
 * @param {string} query - Legal question/query
 * @param {function} onData - Callback for streaming OpenAI response
 * @param {function} onError - Callback for handling errors
 */
async function callGitHubLegalAssistant(query, onData, onError) {
  try {
    const client = new OpenAI({
      baseURL: GITHUB_ENDPOINT,
      apiKey: GITHUB_TOKEN,
    });

    const stream = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content:
            "You are a legal assistant providing detailed and well-researched legal information. Your responses should be accurate, well-structured, and, where applicable, cite relevant legal principles or case law.",
        },
        { role: "user", content: query },
      ],
      stream: true,
      stream_options: { include_usage: true }, // Tracks token usage
    });

    let usage = null;
    for await (const part of stream) {
      onData(part.choices[0]?.delta?.content || ""); // Send streamed content
      if (part.usage) {
        usage = part.usage;
      }
    }

    // if (usage) {
    //   console.log(`Prompt tokens: ${usage.prompt_tokens}`);
    //   console.log(`Completion tokens: ${usage.completion_tokens}`);
    //   console.log(`Total tokens: ${usage.total_tokens}`);
    // }
  } catch (error) {
    if (onError) onError(`GitHub AI API Error: ${error.message}`);
  }
}

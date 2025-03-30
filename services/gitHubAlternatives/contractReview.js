
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o-mini";

async function callGithubModel(contractText, onData, onError) {
  try {
    const client = new OpenAI({ baseURL: endpoint, apiKey: GITHUB_TOKEN });

    const contractChunks = splitText(contractText, MAX_TOKENS);

    for (const chunk of contractChunks) {
      const stream = await client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert contract analyst. Review the following contract(s) and provide:
              1. Key clauses and their meaning
              2. Potential legal risks
              3. Areas needing clarification`,
          },
          { role: "user", content: chunk },
        ],
        model: modelName,
        stream: true,
        stream_options: { include_usage: true },
      });

      let buffer = "";
      let usage = null;

      for await (const part of stream) {
        const content = part.choices?.[0]?.delta?.content;
        if (content) {
          buffer += content;

          // Process only complete lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Store any incomplete line

          for (let line of lines) {
            onData(line);
          }
        }

        if (part.usage) {
          usage = part.usage;
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        onData(buffer);
      }

      // Log token usage if available
      // if (usage) {
      //   console.log(`Prompt tokens: ${usage.prompt_tokens}`);
      //   console.log(`Completion tokens: ${usage.completion_tokens}`);
      //   console.log(`Total tokens: ${usage.total_tokens}`);
      // }
    }
  } catch (error) {
    if (onError) onError(error.message || "Failed to process contract.");
  }
}

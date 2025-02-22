import OpenAI from "openai";

const client = new OpenAI({
    apiKey: "ollama",
    baseURL: "http://localhost:3000/v1/"
});

async function main() {
    const chatCompletion = await client.chat.completions.create({
        model: "DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf",
        messages: [{ role: "user", content: "Say this is a test" }],
        stream: false
    });

    console.log("Response received:", JSON.stringify(chatCompletion, null, 2));

    // Ensure `choices` exists before accessing it
    if (!chatCompletion.choices || chatCompletion.choices.length === 0) {
        console.error("❌ ERROR: No choices returned from API!");
        return;
      }
  
      console.log(chatCompletion.choices[0].message.content);
}

main();

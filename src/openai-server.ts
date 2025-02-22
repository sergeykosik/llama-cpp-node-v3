import express, { Request, Response } from "express";
import { fileURLToPath } from "url";
import path from "path";
import { getLlama, LlamaChatSession, LlamaCompletion } from "node-llama-cpp";

// Load environment variables
const MODEL_NAME = "DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, "..", "models");

const app = express();
app.use(express.json());

let model: any, llama;

// Load the model at startup
async function loadModel() {
    try {
        console.log(`🔹 Initializing Llama...`);
        llama = await getLlama();
        console.log(`📥 Loading model: ${MODEL_NAME}`);
        model = await llama.loadModel({ modelPath: path.join(MODELS_DIR, MODEL_NAME) });

        if (!model) {
            throw new Error("Model failed to load.");
        }
        
        console.log(`✅ Model ${MODEL_NAME} loaded successfully!`);
    } catch (error) {
        console.error("❌ ERROR loading model:", error);
        process.exit(1);
    }
}

// Helper: Convert OpenAI-style messages to a single prompt
function formatMessages(messages: any) {
    return messages.map((m: any) => `${m.role}: ${m.content}`).join("\n") + "\nassistant:";
}

// POST /v1/chat/completions - OpenAI API Compatible
app.post("/v1/chat/completions", async (req: Request, res: Response) => {
    try {
        if (!model) {
            return res.status(500).json({ error: "Model not loaded yet, try again later." });
        }

        const { model: modelName, messages, max_tokens = 200, temperature = 0.7, stream = false } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid 'messages' parameter" });
        }

        const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n") + "\nassistant:";
        const context = await model.createContext();
        const completion = new LlamaCompletion({ contextSequence: context.getSequence() });

        if (stream) {
            res.setHeader("Content-Type", "text/event-stream");
            const streamResponse = await completion.generateCompletion(prompt, { maxTokens: max_tokens, temperature });

            for await (const chunk of streamResponse) {
                res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`);
            }
            res.write("data: [DONE]\n\n");
            res.end();
        } else {
            const response = await completion.generateCompletion(prompt, { maxTokens: max_tokens, temperature });
            res.json({
                id: `chatcmpl-${Date.now()}`,
                object: "chat.completion",
                created: Math.floor(Date.now() / 1000),
                model: MODEL_NAME,
                choices: [{ message: { role: "assistant", content: response }, finish_reason: "stop" }]
            });
        }
    } catch (error) {
        console.error("❌ ERROR:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start server after loading the model
const PORT = 3000;
loadModel().then(() => {
    app.listen(PORT, () => console.log(`🚀 OpenAI-compatible API running at http://localhost:${PORT}`));
});

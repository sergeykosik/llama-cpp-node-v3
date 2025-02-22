import express, { Request, Response } from "express";
import { fileURLToPath } from "url";
import path from "path";
import { getLlama, LlamaCompletion } from "node-llama-cpp";

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
        console.log(`✅ Model ${MODEL_NAME} loaded successfully!`);
    } catch (error) {
        console.error("❌ ERROR loading model:", error);
        process.exit(1);
    }
}

// POST /api/generate - Uses the preloaded model
app.post("/api/generate", async (req: Request, res: Response) => {
    try {
        const { prompt, stream = false, options = {} } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Missing 'prompt' parameter" });
        }

        const context = await model.createContext();
        const completion = new LlamaCompletion({
            contextSequence: context.getSequence()
        });

        const params = {
            maxTokens: options.max_tokens ?? 200,
            temperature: options.temperature ?? 0.7
        };

        if (stream) {
            res.setHeader("Content-Type", "text/plain");
            const streamResponse = await completion.generateCompletion(prompt, params);
            for await (const chunk of streamResponse) {
                res.write(chunk);
            }
            res.end();
        } else {
            const response = await completion.generateCompletion(prompt, params);
            res.json({ model: MODEL_NAME, response });
        }
    } catch (error) {
        console.error("❌ ERROR:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start server after loading the model
const PORT = 3000;
loadModel().then(() => {
    app.listen(PORT, () => console.log(`🚀 API running at http://localhost:${PORT}`));
});

import express, { Request, Response } from "express";
import { fileURLToPath } from "url";
import path from "path";
import { getLlama, LlamaChatSession, resolveModelFile } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDirectory = path.join(__dirname, "..", "models");

const app = express();
const port: number = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(express.json());

(async () => {
    const llama = await getLlama();

    console.log("Resolving model file...");
    const modelPath = await resolveModelFile(
        // "hf:mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF/Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf",
        // "deepseek-coder-6.7b-instruct.Q4_K_M.gguf",
        "DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf",
        modelsDirectory
    );
    
    console.log("Loading model...");
    const model = await llama.loadModel({ modelPath });
    const context = await model.createContext();
    const session = new LlamaChatSession({
        contextSequence: context.getSequence(),
        systemPrompt: `You are an expert full-stack developer specializing in both ASP.NET Razor and Web Components. Your task is to convert Razor HTML snippet into SDS Breadcrumb Web Component while preserving all functionality and Razor expressions. BE CONCISE - RETURN ONLY THE CONVERTED HTML WITH NO EXPLANATIONS.

Example Input/Output Format:
Input: 

<a href="@(Url.AccClientUrl<BankAccountsController>(o => o.Index()))">@i18n.Web.Banks</a> >
<a href="@(Url.AccClientUrl<JournalController>(o => o.BankStatementBatches(null)))">@i18n.Web.BankStatements</a> >
@ViewBag.Title

Output:

<sds-breadcrumbs>
  <sds-breadcrumb-item href="@(Url.AccClientUrl<BankAccountsController>(o => o.Index()))">
    @i18n.Web.Banks
  </sds-breadcrumb-item>
  <sds-breadcrumb-item href="@(Url.AccClientUrl<JournalController>(o => o.BankStatementBatches(null)))">
    @i18n.Web.BankStatements
  </sds-breadcrumb-item>
  <sds-breadcrumb-item current="">
    @ViewBag.Title
  </sds-breadcrumb-item>
</sds-breadcrumbs>

`
    });
    const grammar = await llama.getGrammarFor("json");

    // Warm-up the model
    await session.prompt("Hello");

    app.post("/api/v1/messages", async (req: Request, res: Response) => {
        try {
            const { message }: { message: string } = req.body;
            if (!message) {
                return res.status(400).json({ error: "Message is required" });
            }

            const startTime = Date.now();
            const response: string = await session.prompt(message, {
                // grammar, 
                maxTokens: context.contextSize,
                /* temperature: 0.8,
                topK: 40,
                topP: 0.02,
                seed: 2462,  */
            });
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            res.json({ response: response, duration: `${duration}s` });
        } catch (error) {
            console.error("Error processing message:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
})();

export class JobBase {
    constructor(config = {}) {
        this.systemPrompt = config.systemPrompt || "";
    }

    async process(content, filePath) {
        throw new Error("process method must be implemented by job class");
    }

    // Not used and probably incorrect as systemPrompt assigned in server.ts
    createPrompt(content) {
        return this.systemPrompt
            ? `${this.systemPrompt}\n\n${content}`
            : content;
    }
}

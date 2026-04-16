import { getRagTopK } from "@modules/chatbot/knowledgeBase.constants";
import { retrieveRelevantChunks } from "@modules/chatbot/knowledgeBase.vectorSearch";
import { groqClient } from "@modules/chatbot/groqClient";
import { ApiError } from "@/utils/apiError";
import type { IMessage } from "@modules/chatbot/chatbot.interface";

const CHAT_MODEL = "llama-3.1-8b-instant";
const MAX_HISTORY_MESSAGES = 10; // Keep last 10 messages (5 turns)

function getChatTemperature(): number {
    const t = Number.parseFloat(process.env.GROQ_CHAT_TEMPERATURE ?? "0.25");
    return Number.isNaN(t) ? 0.25 : Math.min(2, Math.max(0, t));
}

function getChatMaxTokens(): number {
    const n = Number.parseInt(process.env.GROQ_CHAT_MAX_TOKENS ?? "1024", 10);
    const v = Number.isNaN(n) ? 1024 : n;
    return Math.max(1, v);
}

const RESPONSE_MARKDOWN_FORMAT = `Response format:
- Use Markdown: **bold** for product names or titles, bullet lists for specs.
- Keep layout compact: at most one blank line between sections; do not add extra blank lines between a numbered item and its bullet, or between list items.`;

function buildSystemPrompt(contextChunks: { text: string }[]): string {
    const k = getRagTopK();
    const hasContext = contextChunks.length > 0 && contextChunks.some((c) => c.text.trim().length > 0);

    if (!hasContext) {
        return `You are an expert for Euro Media printing solutions. 
        Apologize that no catalog data was found for this specific query and suggest contacting support.`;
    }

    const contextBody = contextChunks
        .slice(0, k)
        .map((c, i) => `[Excerpt ${i + 1}]: ${c.text}`)
        .join("\n\n");

    return `You are the Euro Media product catalog assistant.
    ${RESPONSE_MARKDOWN_FORMAT}
    
    Rules:
    - Use ONLY the provided excerpts to answer (internally—do not tell the user you are doing this).
    - Do NOT start replies with meta phrases such as "Based on the provided excerpts", "According to the excerpts", "From the catalog", or similar. Begin directly with the answer (e.g. product name, specs, or list).
    - If the info isn't there, say you don't know briefly—without mentioning excerpts.
    - Quote specs (dpi, speed) exactly.
    
    Knowledge Base Excerpts:
    ${contextBody}`;
}

export class ChatbotService {
    constructor() { }

    /**
     * Trims the history to a rolling window to stay within context limits.
     * Always preserves the System Prompt (added externally during completion).
     */
    private trimHistory(history: IMessage[]): IMessage[] {
        if (!history || history.length <= MAX_HISTORY_MESSAGES) {
            return history || [];
        }
        // Keep the most recent messages
        return history.slice(-MAX_HISTORY_MESSAGES);
    }

    async getGroqResponse(history: IMessage[], userMessage: string) {
        const apiKey = process.env.GROQ_API_KEY?.trim();
        if (!apiKey) {
            throw new ApiError(503, "errors.chatbot_not_configured");
        }

        let relevantChunks: { text: string }[] = [];
        try {
            relevantChunks = await retrieveRelevantChunks(userMessage);
        } catch (err) {
            console.error("[chatbot] Vector search failed:", err);
        }

        const systemPrompt = buildSystemPrompt(relevantChunks);

        // Apply rolling window trimming to incoming history
        const trimmedHistory = this.trimHistory(history).map((h) => ({
            role: (h.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: h.content
        }));

        let responseText: string;
        try {
            const completion = await groqClient.chat.completions.create({
                model: CHAT_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...trimmedHistory,
                    { role: "user", content: userMessage }
                ],
                temperature: getChatTemperature(),
                max_tokens: getChatMaxTokens(),
                top_p: 1,
                stream: false,
            });

            responseText = completion.choices[0]?.message?.content || "";
        } catch (err) {
            console.error("[chatbot] Groq completion failed:", err);
            throw new ApiError(503, "errors.chatbot_llm_unavailable");
        }

        return responseText;
    }
}

export default new ChatbotService();

import { getRagTopK } from "@modules/chatbot/knowledgeBase.constants";
import { retrieveRelevantChunks } from "@modules/chatbot/knowledgeBase.vectorSearch";
import { groqClient } from "@modules/chatbot/groqClient";
import { ApiError } from "@/utils/apiError";
import type { IMessage } from "@modules/chatbot/chatbot.interface";
import Chatbot from "@modules/chatbot/chatbot.model";
import { CompanyModel } from "@modules/company/company.schema";


const CHAT_MODEL = "llama-3.1-8b-instant";
const MAX_HISTORY_MESSAGES = 4;

// Plain-text last resort used only when the company DB fetch itself fails
const WHATSAPP_BARE_FALLBACK =
    "أهلاً! 👋 الدعم الفني هيتواصل معاك في أقرب وقت خلال ساعات العمل 🕐";

/** Builds a WhatsApp-formatted message with the company's contact details.
 *  The main text is read from WHATSAPP_FALLBACK_MESSAGE in .env so you can
 *  edit it without touching code. Company contact lines are appended automatically.
 */
async function buildWhatsAppFallback(): Promise<string> {
    try {
        const company = await CompanyModel.findOne().lean();

        // .env stores \n as a literal backslash-n — convert it to a real newline
        const rawMsg = process.env.WHATSAPP_FALLBACK_MESSAGE?.trim();
        const mainText = rawMsg
            ? rawMsg.replace(/\\n/g, "\n")
            : `أهلاً! 👋\nالدعم الفني من *Euro Media* هيتواصل معاك في أقرب وقت خلال ساعات العمل 🕐`;

        const lines: string[] = [mainText];

        const hasContact =
            company?.phoneNumber || company?.email || company?.website || company?.address;

        if (hasContact) {
            const contactHeader =
                process.env.WHATSAPP_CONTACT_HEADER?.trim() || "*أو تواصل معانا مباشرة:*";
                lines.push(
                    "", 
                    contactHeader,
                    "📞 +966559898005",
                    "📞 +966548092425",
                    "📧 info@euromedia.com",
                    "🌐 euromedia.com"
                );
        }

        return lines.join("\n");
    } catch {
        return WHATSAPP_BARE_FALLBACK;
    }
}

function getChatTemperature(): number {
    const t = Number.parseFloat(process.env.GROQ_CHAT_TEMPERATURE ?? "0.25");
    return Number.isNaN(t) ? 0.25 : Math.min(2, Math.max(0, t));
}

function getChatMaxTokens(): number {
    const n = Number.parseInt(process.env.GROQ_CHAT_MAX_TOKENS ?? "512", 10);
    const v = Number.isNaN(n) ? 512 : n;
    return Math.max(1, v);
}

function getMaxExcerptChars(): number {
    const n = Number.parseInt(process.env.RAG_MAX_EXCERPT_CHARS ?? "350", 10);
    return Number.isNaN(n) || n < 50 ? 350 : n;
}

// ─── Language detection ────────────────────────────────────────────────────

type DetectedLanguage = "arabic" | "english";

function detectLanguage(text: string): DetectedLanguage {
    // Arabic Unicode block: U+0600–U+06FF
    const arabicCharCount = (text.match(/[؀-ۿ]/g) ?? []).length;
    const letterCount = (text.match(/[a-zA-Z؀-ۿ]/g) ?? []).length;
    if (letterCount === 0) return "english";
    return arabicCharCount / letterCount >= 0.4 ? "arabic" : "english";
}

function buildLanguageDirective(lang: DetectedLanguage, channel: "web" | "whatsapp"): string {
    if (lang === "arabic") {
        const formatNote = channel === "web"
            ? " FORMATTING: use **double asterisks** for bold (e.g. **كلمة**) — NEVER single asterisk. Do NOT add closing notes, disclaimers, or ملاحظة sentences."
            : " Do NOT add closing notes, disclaimers, or ملاحظة sentences.";
        return `LANGUAGE DIRECTIVE: The user wrote in Arabic. Your ENTIRE response MUST be in Arabic. Do NOT write any English words except product names, model numbers, and technical specs (dpi, speed, resolution, dimensions).${formatNote}`;
    }
    return "LANGUAGE DIRECTIVE: The user wrote in English. Your ENTIRE response MUST be in English.";
}

// ─── System prompt builders ────────────────────────────────────────────────

const WEB_FORMAT_RULES = `Response format:
- Use Markdown: **double asterisks** for bold (e.g. **Product Name**) — NEVER single asterisks.
- Bullet lists for specs. Keep layout compact: at most one blank line between sections.`;

// WhatsApp renders *single asterisk* as bold and ignores standard Markdown.
const WHATSAPP_FORMAT_RULES = `Response format:
- Use WhatsApp formatting only: *bold* (single asterisk), plain • bullets.
- Do NOT use **double asterisks**, ##headers, or ---dividers — they show as raw characters on WhatsApp.
- Keep responses concise and conversational.`;

const SHARED_RULES = `Rules:
- CRITICAL — LANGUAGE: The knowledge base excerpts may be in Arabic, but you MUST respond in the same language the customer used. Follow these rules exactly:
  • Customer wrote in Arabic → write your response in Arabic, but keep product names, model numbers, specs (dpi, speed, dimensions, resolution), and technical values in English exactly as they appear in the excerpts.
  • Customer wrote in English → reply entirely in English, regardless of what language the excerpts are in.
  • Customer wrote in any other language → reply in that same language.
  • Never translate product names or technical specs — always keep them as-is from the knowledge base.
  • Do NOT let the language of the knowledge base excerpts influence the language of your response.
- You are a PRODUCT CATALOG assistant. You ONLY answer questions about Euro Media products, services, and the company.
- If the question is NOT about Euro Media products or services (e.g. general knowledge, coding, unrelated topics), do NOT answer it. Instead reply ONLY with the appropriate message for the customer's language:
  • If customer wrote in Arabic: "عندي معلومات عن منتجات يورو ميديا بس — للأسئلة التانية تقدر تتواصل معانا مباشرة:\n📞 +966559898005 | +966548092425\n📧 info@euromedia.com\n🌐 euromedia.com"
  • If customer wrote in English: "I only have information about Euro Media products — for other questions, feel free to reach us directly:\n📞 +966559898005 | +966548092425\n📧 info@euromedia.com\n🌐 euromedia.com"
- Use ONLY the provided excerpts to answer product questions — never use general knowledge or training data.
- Do NOT open with phrases like "Based on the excerpts" or "According to the catalog". Start directly with the answer.
- Quote specs (dpi, speed, resolution) exactly as they appear.
- NEVER add vague filler phrases, closing notes, or disclaimers. Banned examples: "and other products", "and more", "من فئات أخرى", "و منتجات أخرى", "ملاحظة:", "تنبيه:", "يمكنك التواصل معنا", "للمزيد من المعلومات", "هذه بعض من". List ONLY what is explicitly in the excerpts. If the list is incomplete, end cleanly without implying there is more.`;

function buildSystemPrompt(
    contextChunks: { text: string }[],
    channel: "web" | "whatsapp" = "web",
    userMessage = "",
): string {
    const lang = detectLanguage(userMessage);
    const languageDirective = buildLanguageDirective(lang, channel);
    const k = getRagTopK();
    const hasContext = contextChunks.length > 0 && contextChunks.some((c) => c.text.trim().length > 0);

    if (!hasContext) {
        const noContextMsg = lang === "arabic"
            ? "أنا مساعد كتالوج منتجات يورو ميديا. للأسف مفيش معلومات في الكتالوج تخص سؤالك، تقدر تتواصل مع فريق الدعم لمساعدتك."
            : "You are an expert for Euro Media printing solutions. Apologize that no catalog data was found for this specific query and suggest contacting support.";
        return `${languageDirective}\n\n${noContextMsg}`;
    }

    const maxChars = getMaxExcerptChars();
    const contextBody = contextChunks
        .slice(0, k)
        .map((c, i) => {
            const text = c.text.length > maxChars ? c.text.slice(0, maxChars) + "…" : c.text;
            return `[Excerpt ${i + 1}]: ${text}`;
        })
        .join("\n\n");

    const formatRules = channel === "whatsapp" ? WHATSAPP_FORMAT_RULES : WEB_FORMAT_RULES;

    return `${languageDirective}

You are the Euro Media product catalog assistant.
${formatRules}

${SHARED_RULES}

Knowledge Base Excerpts:
${contextBody}`;
}

// ─── Service ───────────────────────────────────────────────────────────────

export class ChatbotService {
    constructor() { }

    private trimHistory(history: IMessage[]): IMessage[] {
        if (!history || history.length <= MAX_HISTORY_MESSAGES) return history || [];
        return history.slice(-MAX_HISTORY_MESSAGES);
    }

    /**
     * Filter out any corrupted history entries (empty content saved before bug fixes).
     * Without this, a single bad entry poisons the entire conversation context.
     */
    private cleanHistory(messages: { role: string; content: string }[]): IMessage[] {
        return messages
            .filter((m) => m.content?.trim().length > 0)
            .map((m) => ({ role: m.role, content: m.content })) as IMessage[];
    }

    /**
     * Raw Groq call. Preserves 429 so callers can retry; wraps everything else as 503.
     */
    private async callGroq(
        systemPrompt: string,
        history: IMessage[],
        userMessage: string,
    ): Promise<string> {
        const apiKey = process.env.GROQ_API_KEY?.trim();
        if (!apiKey) throw new ApiError(503, "errors.chatbot_not_configured");

        const trimmedHistory = this.trimHistory(history).map((h) => ({
            role: (h.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: h.content,
        }));

        try {
            const completion = await groqClient.chat.completions.create({
                model: CHAT_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...trimmedHistory,
                    { role: "user", content: userMessage },
                ],
                temperature: getChatTemperature(),
                max_tokens: getChatMaxTokens(),
                top_p: 1,
                stream: false,
            });
            return completion.choices[0]?.message?.content || "";
        } catch (err: any) {
            console.error("[chatbot] Groq completion failed:", err);
            if (err?.status === 429) throw err; // preserve for retry-after header
            throw new ApiError(503, "errors.chatbot_llm_unavailable");
        }
    }

    /**
     * Stateless response for the website chatbot.
     * History is passed in from the frontend; nothing is saved to DB here.
     */
    async getGroqResponse(history: IMessage[], userMessage: string): Promise<string> {
        let relevantChunks: { text: string }[] = [];
        try {
            relevantChunks = await retrieveRelevantChunks(userMessage);
        } catch (err) {
            console.error("[chatbot] Vector search failed:", err);
        }

        const systemPrompt = buildSystemPrompt(relevantChunks, "web", userMessage);
        try {
            return await this.callGroq(systemPrompt, history, userMessage);
        } catch (err: any) {
            if (err?.status === 429) throw new ApiError(503, "errors.chatbot_llm_unavailable");
            throw err;
        }
    }

    /**
     * Stateful response for WhatsApp messages.
     * - Cleans corrupted history from DB before use.
     * - Returns Arabic fallback if no catalog context matches.
     * - Retries once on 429 using the retry-after header.
     * - Uses WhatsApp-specific formatting and language-matching rules.
     * - Only saves to DB on a successful AI response.
     */
    async handleWhatsAppChat(query: string, identifier: string): Promise<string> {
        if (!query.trim()) return buildWhatsAppFallback();

        let relevantChunks: { text: string; score?: number }[] = [];
        try {
            relevantChunks = await retrieveRelevantChunks(query);
        } catch (err) {
            console.error("[chatbot/wa] Vector search failed:", err);
        }

        // Require a meaningful similarity score — low scores mean the question
        // is unrelated to the catalog (e.g. "how to make a Python variable")
        const MIN_SCORE = Number.parseFloat(process.env.RAG_WA_MIN_SCORE ?? "0.45");
        const bestScore = relevantChunks.reduce((max, c) => Math.max(max, c.score ?? 0), 0);
        const hasContext =
            relevantChunks.length > 0 &&
            relevantChunks.some((c) => c.text.trim().length > 0) &&
            bestScore >= MIN_SCORE;

        if (!hasContext) return buildWhatsAppFallback();

        let chatbot = await Chatbot.findOne({ identifier });
        if (!chatbot) chatbot = new Chatbot({ identifier, messages: [] });

        // Strip any corrupted entries before feeding history to the model
        const history = this.cleanHistory(
            chatbot.messages.map((m) => ({ role: m.role, content: m.content })),
        );

        const systemPrompt = buildSystemPrompt(relevantChunks, "whatsapp", query);

        let response: string;
        try {
            response = await this.callGroq(systemPrompt, history, query);
        } catch (err: any) {
            if (err?.status === 429) {
                const retryAfterSec = parseInt(err?.headers?.get?.("retry-after") ?? "3");
                const waitMs = (retryAfterSec + 1) * 1000;
                console.warn(`[chatbot/wa] Rate limited. Retrying in ${waitMs}ms…`);
                await new Promise((r) => setTimeout(r, waitMs));
                try {
                    response = await this.callGroq(systemPrompt, history, query);
                } catch {
                    return buildWhatsAppFallback();
                }
            } else {
                return buildWhatsAppFallback();
            }
        }

        if (!response) return buildWhatsAppFallback();

        chatbot.messages.push({ role: "user", content: query, timestamp: new Date() });
        chatbot.messages.push({ role: "assistant", content: response, timestamp: new Date() });
        if (chatbot.messages.length > MAX_HISTORY_MESSAGES) {
            chatbot.messages = chatbot.messages.slice(-MAX_HISTORY_MESSAGES);
        }
        await chatbot.save();

        return response;
    }
}

export default new ChatbotService();

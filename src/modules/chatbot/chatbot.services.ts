import { ChatbotModel } from "@/modules/chatbot/chatbot.schema";
import { GenericServices } from "@/services/genericServices";
import type { IChatbot } from "@modules/chatbot/chatbot.interface";
import { Model } from "mongoose";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// 1. Initialize GenAI client
const genAI = new GoogleGenAI({ 
    apiKey: (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) as string
});

// Cache the Markdown content so it is read from disk only once
let cachedCatalog: string | null = null;

function getCatalogContent(): string {
    if (cachedCatalog !== null) return cachedCatalog;
    
    // Path to the new Markdown file we created
    const mdPath = path.join(process.cwd(), "public/docs/CatalogFinal.md");
    
    if (fs.existsSync(mdPath)) {
        cachedCatalog = fs.readFileSync(mdPath, "utf-8");
    } else {
        console.error("Catalog MD file not found at:", mdPath);
        cachedCatalog = "";
    }
    return cachedCatalog;
}

export class ChatbotService extends GenericServices<IChatbot> {
    constructor(model: Model<IChatbot>) {
        super(model);
    }

    async getGeminiResponse(userId: string, userMessage: string) {
        // 1. Get history or create new session
        let chatSession = await this.model.findOne({ userId });
        if (!chatSession) {
            chatSession = await this.model.create({ userId, messages: [] });
        }

        const history = chatSession.messages.map(h => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content }]
        }));

        const catalogData = getCatalogContent();

        // 2. Create chat session
        // Putting catalog in system_instruction is the most token-efficient way
        const chat = genAI.chats.create({
            model: "gemini-2.0-flash",
            config: {
                systemInstruction: {
                    parts: [{ 
                        text: `You are an expert for Euro Media printing solutions. 
                               Use the following catalog data to answer customer queries:
                               \n\n${catalogData}\n\n
                               Provide specific details like resolution and speed accurately.` 
                    }]
                }
            },
            history
        });

        // 3. Send message
        // Since the catalog is in the system instructions, we only send the user's text
        const result = await chat.sendMessage({
            message: [{ text: userMessage }]
        });

        const responseText = result.text || "";

        // 4. Save the exchange to MongoDB
        await this.model.updateOne(
            { userId },
            {
                $push: {
                    messages: {
                        $each: [
                            { role: "user", content: userMessage },
                            { role: "model", content: responseText }
                        ]
                    }
                }
            }
        );

        return responseText;
    }
}

export default new ChatbotService(ChatbotModel);
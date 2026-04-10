import type { IChatbot } from "@/modules/chatbot/chatbot.interface";
import { Schema, model } from "mongoose";

const chatbotSchema = new Schema<IChatbot>({
    userId: { type: String, required: true },
    messages: [
        {
            role: { type: String, enum: ["user", "model"] },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

const ChatbotModel = model<IChatbot>("Chatbot", chatbotSchema);

export { ChatbotModel };
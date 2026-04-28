import mongoose, { Schema } from "mongoose";
import type { IChatbot, IMessage } from "./chatbot.interface";

const MessageSchema = new Schema<IMessage>({
    role: {
        type: String,
        enum: ["user", "assistant", "model"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const ChatbotSchema = new Schema<IChatbot>({
    identifier: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    messages: [MessageSchema]
}, {
    timestamps: true
});

// Auto-delete conversations that have been inactive for CHAT_HISTORY_TTL_DAYS (default 30).
// MongoDB checks this index roughly every 60 seconds, so deletion isn't instant but is automatic.
ChatbotSchema.index(
    { updatedAt: 1 },
    { expireAfterSeconds: Number.parseInt(process.env.CHAT_HISTORY_TTL_HOURS ?? "5", 10) * 60 * 60 },
);

export default mongoose.model<IChatbot>("Chatbot", ChatbotSchema);

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

export default mongoose.model<IChatbot>("Chatbot", ChatbotSchema);

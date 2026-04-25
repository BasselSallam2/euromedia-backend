import { Document } from "mongoose";

interface IMessage {
    role: "user" | "assistant" | "model";
    content: string;
    timestamp?: Date;
}

interface IChatbot extends Document {
    identifier: string; // Web Session ID or WhatsApp Phone Number
    messages: IMessage[];
}

export type { IChatbot, IMessage };

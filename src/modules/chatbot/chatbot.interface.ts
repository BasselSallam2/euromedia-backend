import { Document } from "mongoose";

interface IMessage {
    role: "user" | "assistant" | "model";
    content: string;
    timestamp?: Date;
}

interface IChatbot extends Document {
    userId: string;
    messages: IMessage[];
}

export type { IChatbot, IMessage };

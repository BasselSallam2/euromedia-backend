import { Document } from "mongoose";

export interface IContact extends Document {
    name: string;
    email: string;
    inquiry: string;
    status: "pending" | "viewed" | "contacted";
    createdAt: Date;
    updatedAt: Date;
}

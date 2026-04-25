import { Document } from "mongoose";

export interface ICompany extends Document {
    name: string;
    address?: string;
    email?: string;
    phoneNumber?: string;
    logo?: string;
    website?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

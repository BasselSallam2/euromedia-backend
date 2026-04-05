import { Document, Types } from "mongoose";

interface IRole extends Document {
    name: string;
    permissions: string[];
}


export type { IRole };

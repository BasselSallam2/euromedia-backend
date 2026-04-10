import { Document } from "mongoose";

interface IBrand extends Document {
    name: string;
    image: string;
    metadata: any;
}


export type { IBrand };

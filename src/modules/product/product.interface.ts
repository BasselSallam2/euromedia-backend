import { Document, Types } from "mongoose";

interface IProduct extends Document {
    name: string;
    brand: Types.ObjectId;
    description: string;
    weight: number;
    modelNumber: string;
    images: string[];
    metadata: any;
    category: Types.ObjectId;
    printHeadType?: string;
    printHeadQty?: string;
    maxResolution?: string;
    printSpeed?: string;
    maxPrintWidth?: string;
    inkType?: string;
}


export type { IProduct };

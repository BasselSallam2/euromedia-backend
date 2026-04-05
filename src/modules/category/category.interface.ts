import { Document } from "mongoose";

interface ICategory extends Document {
    name: string;
    image: string;
    description: string;
}


export type { ICategory };

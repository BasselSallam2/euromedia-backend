import type { ICategory } from "@/modules/category/category.interface";
import { Schema, model } from "mongoose";


const categorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true },
        image: { type: String },
        description: { type: String },
    },
    {
        timestamps: true,
    },
);


const CategoryModel = model<ICategory>("Category", categorySchema);

export { CategoryModel };
import type { IProduct } from "@/modules/product/product.interface";
import { Schema, model } from "mongoose";


const productSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true },
        brand: { type: Schema.Types.ObjectId, ref: "Brand" },
        description: { type: String },
        weight: { type: Number },
        modelNumber: { type: String },
        images: { type: [String] },
        metadata: { type: Schema.Types.Mixed },
        category: { type: Schema.Types.ObjectId, ref: "Category" },
    },
    {
        timestamps: true,
    },
);


const ProductModel = model<IProduct>("Product", productSchema);

export { ProductModel };
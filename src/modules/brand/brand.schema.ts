import type { IBrand } from "@/modules/brand/brand.interface";
import { Schema, model } from "mongoose";


const brandSchema = new Schema<IBrand>(
    {
        name: { type: String, required: true },
        image: { type: String },
        metadata: { type: Schema.Types.Mixed },
    },
    {
        timestamps: true,
    },
);

const BrandModel = model<IBrand>("Brand", brandSchema);

export { BrandModel };
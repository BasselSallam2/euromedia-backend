import type { IExhibition } from "@/modules/exhibition/exhibition.interface";
import { Schema, model } from "mongoose";


const exhibitionSchema = new Schema<IExhibition>(
    {
        title: { type: String },
        images: { type: [String] },
        location: { type: String },
        date: { type: String },
        url: { type: String },
        metadata: { type: Schema.Types.Mixed },
    },
    {
        timestamps: true,
    },
);


const ExhibitionModel = model<IExhibition>("Exhibition", exhibitionSchema);

export { ExhibitionModel };
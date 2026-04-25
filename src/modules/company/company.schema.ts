import { Schema, model } from "mongoose";
import type { ICompany } from "./company.interface";

const companySchema = new Schema<ICompany>(
    {
        name: { type: String, required: true },
        address: { type: String },
        email: { type: String },
        phoneNumber: { type: String },
        logo: { type: String },
        website: { type: String },
        metadata: { type: Schema.Types.Mixed },
    },
    {
        timestamps: true,
    }
);

export const CompanyModel = model<ICompany>("Company", companySchema);

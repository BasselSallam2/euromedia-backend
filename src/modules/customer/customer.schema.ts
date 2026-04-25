import { Schema, model } from "mongoose";
import type { ICustomer } from "./customer.interface";

const customerSchema = new Schema<ICustomer>(
    {
        name: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true },
        companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    },
    {
        timestamps: true,
    }
);

export const CustomerModel = model<ICustomer>("Customer", customerSchema);

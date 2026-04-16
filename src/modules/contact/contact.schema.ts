import type { IContact } from "@/modules/contact/contact.interface";
import { Schema, model } from "mongoose";


const contactSchema = new Schema<IContact>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        inquiry: { type: String, required: true },
        status: {
            type: String,
            enum: ["pending", "viewed", "contacted"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    },
);


const ContactModel = model<IContact>("Contact", contactSchema);

export { ContactModel };
import { Document, Types } from "mongoose";

export interface ICustomer extends Document {
    name: string;
    phoneNumber: string;
    email: string;
    companyId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

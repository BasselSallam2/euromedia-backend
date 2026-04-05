import { Document, Types } from "mongoose";

interface IUser extends Document {
    name: string;
    phoneNumber: string;
    email: string;
    password: string;
    role: Types.ObjectId;
}
    
 



export type { IUser };

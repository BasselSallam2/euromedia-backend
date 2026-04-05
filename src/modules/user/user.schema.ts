import type { IUser } from "@/modules/user/user.interface";
import { hashPasswordPlugin } from "@/shared/commonPlugins";
import { Schema, model } from "mongoose";




const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        phoneNumber: { type: String , unique: true },
        email: { type: String, required: true , unique: true },
        password: { type: String },
        role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    },
    {
        timestamps: true,
    },
);

hashPasswordPlugin(userSchema);

const UserModel = model<IUser>("User", userSchema);

export { UserModel };
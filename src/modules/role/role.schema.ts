import type { IRole } from "@/modules/role/role.interface";
import { Schema, model } from "mongoose";


const roleSchema = new Schema<IRole>(
    {
        name: { type: String, required: true },
        permissions: { type: [String], required: true },
    },
    {
        timestamps: true,
    },
);


const RoleModel = model<IRole>("Role", roleSchema);

export { RoleModel };

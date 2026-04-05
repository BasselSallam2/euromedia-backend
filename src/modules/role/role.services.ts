import { RoleModel } from "@/modules/role/role.schema";
import { GenericServices } from "@/services/genericServices";
import type { IRole } from "@modules/role/role.interface";
import { Model } from "mongoose";
export class RoleService extends GenericServices<IRole> {
    constructor(model: Model<IRole>) {
        super(model);
    }


}

export default new RoleService(RoleModel);
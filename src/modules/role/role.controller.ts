import roleService from "@modules/role/role.services";
import { GenericController } from "@shared/genericController";


export class RoleController extends GenericController<typeof roleService> {
    constructor() {
        super(roleService);
       
    }

}

export default new RoleController();
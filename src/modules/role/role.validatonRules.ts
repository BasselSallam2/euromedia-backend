import { CommonUserVlidator } from "@/shared/commonValidator";
import type { ValidationChain } from "express-validator";

class RoleValidator extends CommonUserVlidator {
    constructor() {
        super();
    }

}

export { RoleValidator };
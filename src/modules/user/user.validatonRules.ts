import { CommonUserVlidator } from "@/shared/commonValidator";
import type { ValidationChain } from "express-validator";

class UserValidator extends CommonUserVlidator {
    constructor() {
        super();
    }

}

export { UserValidator };
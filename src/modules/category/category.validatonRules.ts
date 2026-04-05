import { CommonUserVlidator } from "@/shared/commonValidator";
import type { ValidationChain } from "express-validator";

class CategoryValidator extends CommonUserVlidator {
    constructor() {
        super();
    }

}

export { CategoryValidator };
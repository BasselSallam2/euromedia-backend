import { CommonUserVlidator } from "@/shared/commonValidator";
import type { ValidationChain } from "express-validator";

class ProductValidator extends CommonUserVlidator {
    constructor() {
        super();
    }

}

export { ProductValidator };
import { CommonUserVlidator } from "@/shared/commonValidator";
import type { ValidationChain } from "express-validator";

class BrandValidator extends CommonUserVlidator {
    constructor() {
        super();
    }
    
}

export { BrandValidator };
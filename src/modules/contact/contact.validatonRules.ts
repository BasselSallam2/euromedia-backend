import { CommonUserVlidator } from "@/shared/commonValidator";
import type { ValidationChain } from "express-validator";

class ContactValidator extends CommonUserVlidator {
    constructor() {
        super();
    }

}

export { ContactValidator };
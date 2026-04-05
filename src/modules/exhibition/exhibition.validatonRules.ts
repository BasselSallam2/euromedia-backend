import { CommonUserVlidator } from "@/shared/commonValidator";
import type { ValidationChain } from "express-validator";

class ExhibitionValidator extends CommonUserVlidator {
    constructor() {
        super();
    }

}

export { ExhibitionValidator };
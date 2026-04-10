import { CommonUserVlidator } from "@/shared/commonValidator";
import type { ValidationChain } from "express-validator";

class ChatbotValidator extends CommonUserVlidator {
    constructor() {
        super();
    }

}

export { ChatbotValidator };
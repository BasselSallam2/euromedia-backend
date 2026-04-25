import { validateResult } from "@/middlewares/ValidationRequest";
import { CommonUserVlidator } from "@/shared/commonValidator";
import { body } from "express-validator";

export const customerValidation = [
    CommonUserVlidator.isExict(body("name")),
    CommonUserVlidator.email(body("email")),
    CommonUserVlidator.isExict(body("phoneNumber")),
    validateResult
];

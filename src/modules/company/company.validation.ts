import { validateResult } from "@/middlewares/ValidationRequest";
import { CommonUserVlidator } from "@/shared/commonValidator";
import { body } from "express-validator";

export const companyValidation = [
    CommonUserVlidator.isExict(body("name")),
    validateResult
];

export const captureLeadValidation = [
    CommonUserVlidator.isExict(body("personName")),
    CommonUserVlidator.email(body("email")),
    CommonUserVlidator.isExict(body("phoneNumber")),
    validateResult
];

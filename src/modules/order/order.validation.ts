import { validateResult } from "@/middlewares/ValidationRequest";
import { CommonUserVlidator, CommonValidator } from "@/shared/commonValidator";
import { body } from "express-validator";

export const orderValidation = [
    CommonUserVlidator.isExict(body("items")),
    body("items").isArray({ min: 1 }).withMessage("Items must be an array with at least one item"),
    CommonValidator.Number(body("totalPrice"), 0),
    validateResult
];

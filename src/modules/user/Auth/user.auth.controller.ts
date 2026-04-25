// auth.controller.ts
import { ApiError } from "@/utils/apiError";
import type { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import AuthService from "./user.auth.service";
import apiResponse from "@/utils/apiResponse";
import type { Types } from "mongoose";
import userServices from "../user.services";

class AuthController {
    public signin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const t = req.t;
            const result = await AuthService.signin(email, password, t);
            apiResponse.success(res, req.t, 200, "login_successfully", result);
            return;
        } catch (error) {
            next(error);
        }
    });

    getMe = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { _id } = req.user as { _id: Types.ObjectId };
            const user = await AuthService.getMe(_id);
            return apiResponse.getOne(res, user)
        } catch (error) {
            next(error);
        }
    }

}

export default new AuthController();

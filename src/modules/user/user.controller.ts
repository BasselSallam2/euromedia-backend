import userService from "@modules/user/user.services";
import { UserModel } from "@modules/user/user.schema";
import { GenericController } from "@shared/genericController";
import type { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import apiResponse from "@/utils/apiResponse";
import { ApiError } from "@/utils/apiError";
import { Types } from "mongoose";


export class UserController extends GenericController<typeof userService> {
    constructor() {
        super(userService);
    }

    createAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const document = await userService.createAdmin(req.body);
            apiResponse.success(res, req.t, 201, "Created_Successfully", { _id: document._id });
        } catch (error) {
            next(error);
        }
    });

    deleteById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as { id: string };
            if (!id || !Types.ObjectId.isValid(id)) {
                apiResponse.notFound(res, req.t);
                return;
            }
            const user = await UserModel.findById(id).select("email").lean();
            if (!user) {
                apiResponse.notFound(res, req.t);
                return;
            }
            if (user.email === process.env.ADMIN_EMAIL) {
                throw new ApiError(403, "This account cannot be deleted.");
            }
            await userService.deleteById(id);
            apiResponse.deleteOne(res, req.t, id);
        } catch (error) {
            next(error);
        }
    });
 
}

export default new UserController();
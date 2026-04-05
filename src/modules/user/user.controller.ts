import userService from "@modules/user/user.services";
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
    createAddress = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { _id } = req.user as { _id: string };
            const { address , appartmentNumber  , city , area , location , additionalPhoneNumber } = req.body;
            const user = await userService.createAddress(_id , { address , appartmentNumber , city , area , location , additionalPhoneNumber });
            apiResponse.success(res , req.t, 200, "Address_created_successfully");
            return;
        } catch (error) {
            next(error);
        }
    });

    deleteAddress = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { _id } = req.user as { _id: string };
            const { addressId } = req.params as { addressId: string };
            if(!addressId || !Types.ObjectId.isValid(addressId)) {
                next(new ApiError(400, "errors.INVALID_ADDRESS_ID"));
            }
            await userService.deleteAddress(_id, addressId);
            apiResponse.success(res , req.t, 200, "Address_deleted_successfully");
            return;
        } catch (error) {
            next(error);
        }
    });

    getAddresses = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { _id } = req.user as { _id: string };
            const addresses = await userService.getAddresses(_id);
            apiResponse.getOne(res , addresses);
            return;
        } catch (error) {
            next(error);
        }
    });

    editAddress = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { _id } = req.user as { _id: string };
            const { addressId } = req.params as { addressId: string };
            const { address , appartmentNumber , city , area , location , additionalPhoneNumber } = req.body;
            await userService.editAddress(_id, addressId, { address , appartmentNumber , city , area , location , additionalPhoneNumber });
            apiResponse.success(res , req.t, 200, "Address_edited_successfully");
            return;
        } catch (error) {
            next(error);
        }
    });


}

export default new UserController();
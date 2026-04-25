import orderService from "./order.services";
import { GenericController } from "@shared/genericController";
import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import apiResponse from "@/utils/apiResponse";

export class OrderController extends GenericController<typeof orderService> {
    constructor() {
        super(orderService);
    }

    createOne = asyncHandler(async (req: Request, res: Response) => {
        const t = req.t;
        const { body } = req;

        // Attribution: pull the admin's identity from req.user
        if (req.user) {
            body.madeBy = (req.user as any).name;
        }

        const document = await orderService.createOne(body);
        apiResponse.success(res, t, 201, "Created_Successfully", { _id: document._id });
    });
}

export default new OrderController();

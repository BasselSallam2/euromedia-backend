import companyService from "./company.services";
import { GenericController } from "@shared/genericController";
import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import apiResponse from "@/utils/apiResponse";

export class CompanyController extends GenericController<typeof companyService> {
    constructor() {
        super(companyService);
    }

    captureLead = asyncHandler(async (req: Request, res: Response) => {
        const t = req.t;
        const result = await companyService.captureLead(req.body);
        apiResponse.success(res, t, 201, "Lead_Captured_Successfully", result);
    });
}

export default new CompanyController();

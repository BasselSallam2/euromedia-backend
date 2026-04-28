import companyService from "./company.services";
import { GenericController } from "@shared/genericController";
import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import apiResponse from "@/utils/apiResponse";

export class CompanyController extends GenericController<typeof companyService> {
    constructor() {
        super(companyService);
    }

    getSelf = asyncHandler(async (req: Request, res: Response) => {
        const t = req.t;
        const company = await companyService.getSelf();
        apiResponse.success(res, t, 200, "Company_Fetched", company);
    });

    updateSelfLogo = asyncHandler(async (req: Request, res: Response) => {
        const t = req.t;
        const { logo } = req.body;
        const company = await companyService.updateSelfLogo(logo);
        apiResponse.success(res, t, 200, "Logo_Updated", company);
    });

    captureLead = asyncHandler(async (req: Request, res: Response) => {
        const t = req.t;
        const result = await companyService.captureLead(req.body);
        apiResponse.success(res, t, 201, "Lead_Captured_Successfully", result);
    });
}

export default new CompanyController();

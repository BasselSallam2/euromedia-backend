import { ApiError } from "@/utils/apiError";
import apiResponse from "@/utils/apiResponse";
import { GenericServices } from "@services/genericServices";
import type { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import type { PopulateOptions } from "mongoose";
import { Types } from "mongoose";
class GenericController<TService extends GenericServices<any>> {
    protected service: TService;
    public sanitizeOption?: string[];
    constructor(service: TService) {
        this.service = service;
    }

    public getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query;
            let finalPopulate: PopulateOptions | PopulateOptions[] = [];
            if (query.populate) {
                finalPopulate = JSON.parse(query.populate as string);
            }

            const { documents, paginationResult } = await this.service.getAll(
                query,
                finalPopulate,
                this.sanitizeOption,
                req.reqFilter || {},
            );
            if (!Array.isArray(documents) || documents.length === 0) {
                apiResponse.empty(res);
                return;
            }
            apiResponse.getMany(res, documents, paginationResult);
            return;
        } catch (error) {
            next(error);
            return;
        }
    });

    public getOne = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        try {
            const t = req.t;
            const { id } = req.params;
            const { query } = req;
            if (!id || !Types.ObjectId.isValid(id as string)) {
                apiResponse.notFound(res, t);
                return;
            }

            let finalPopulate: PopulateOptions | PopulateOptions[] = [];
            if (query.populate) {
                finalPopulate = JSON.parse(query.populate as string);
            }

            const document = await this.service.getOne(id as string, {
                populateOption: finalPopulate,
                sanitizeOption: (query.fields?.toString()?.split(",") as string[]) || [],
                cache: query.cache as string,
            });
            if (!document) {
                apiResponse.notFound(res, t);
                return;
            }
            apiResponse.getOne(res, document);
            return;
        } catch (error) {
            console.error(error);
            next(error);
            return;
        }
    });

    public deleteById = asyncHandler(async (req: Request, res: Response) => {
        const t = req.t;
        const { id } = req.params;

        if (!id || !Types.ObjectId.isValid(id as string)) {
            apiResponse.notFound(res, t);
            return;
        }

        const document = await this.service.deleteById(id as string);
        if (!document) {
            apiResponse.notFound(res, t);
            return;
        }

        if (req.user) {
            const { _id } = req.user as { _id: string };
            if (id && _id) {

            }
        }
        apiResponse.deleteOne(res, t, id as string);
        return;
    });

    public deleteMany = asyncHandler(async (req: Request, res: Response) => {
        const t = req.t;
        const { body } = req;

        const document = await this.service.deleteMany(body);
        if (!document) {
            apiResponse.notFound(res, t);
            return;
        }

        if (req.user) {
            const { _id } = req.user as { _id: string };
        }
        apiResponse.deleteMany(res, t, document);
        return;
    });

    public updateById = asyncHandler(async (req: Request, res: Response) => {
        const t = req.t;
        const { id } = req.params;
        const { body } = req;

        if (!id || !Types.ObjectId.isValid(id as string)) {
            apiResponse.notFound(res, t);
            return;
        }

        const document = await this.service.updateById(id as string, body);
        if (!document) {
            apiResponse.notFound(res, t);
            return;
        }

        if (req.user) {
            const { _id } = req.user as { _id: string };
        }
        apiResponse.updateOne(res, t);
        return;
    });

    public updateMany = asyncHandler(async (req: Request, res: Response) => {
        const t = req.t;
        const { body, filter } = req.body;

        const document = await this.service.updateMany(filter, body);
        if (document.matchedCount === 0) {
            apiResponse.updateManyNoMatch(res, t);
            return;
        }
        if (req.user) {
            const { _id } = req.user as { _id: string };
        }
        if (req.user) {
            const { _id } = req.user as { _id: string };
        }
        apiResponse.updateMany(res, t, document);
        return;
    });

    public createOne = asyncHandler(async (req: Request, res: Response) => {
        const t = req.t;
        const { body } = req;
        const document = await this.service.createOne(body);

        if (req.user) {
            const { _id } = req.user as { _id: string };
        }

        apiResponse.success(res, t, 201, "Created_Successfully", { _id: document._id });
        return;
    });

    public createMany = asyncHandler(async (req: Request, res: Response) => {
        const t = req.t;
        const { body } = req;
        if (req.user) {
            const { _id } = req.user as { _id: string };
        }
        const document = await this.service.createMany(body);
        apiResponse.success(res, t, 201, "Created_Successfully", document);
        return;
    });

    public exportExcel = asyncHandler(async (req: Request, res: Response) => {
        const t = req.t;
        const workbook = await this.service.exportExcel(`${this.service.modelName}_report}`);
        if (!workbook) {
            throw new ApiError(400, "errors.no_data_found");
        }
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "Report_" + Date.now() + ".xlsx",
        );

        await workbook.xlsx.write(res);
        res.end();
    });
}

export { GenericController };

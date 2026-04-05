import type { Response } from "express";
import type { TFunction } from "i18next";
import { ApiError } from "./apiError";

class ApiResponse<T> {
    deleteOne(res: Response, t: TFunction, id?: string) {
        return res.status(200).json({
            success: true,
            status: "success",
            message: t("deleted_successfully"),
        });
    }

    deleteMany(res: Response, t: TFunction, document: any) {
        return res.status(200).json({
            success: true,
            status: "success",
            message: t("deleted_successfully"),
            deletedCount: document.deletedCount,
        });
    }

    getMany(res: Response, documents: any, paginationResult: any) {
        res.status(200).json({ data: documents, ...paginationResult });
    }

    getOne(res: Response, document: any) {
        return res.status(200).json({
            success: true,
            status: "success",
            data: document,
        });
    }

    notFound(res: Response, t: TFunction) {
        throw new ApiError(404, "errors.document_not_found");
    }

    empty(res: Response) {
        return res.status(200).json({
            data: [],
            count: 0,
            page: 1,
            limit: 1,
            pages: 1,
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null,
            lastPage: 1,
            status: "fail",
            success: false,
        });
    }

    updateOne(res: Response, t: TFunction, document?: any) {
        return res
            .status(200)
            .json({ success: true, status: "success", message: t("updated_successfully") });
    }

    updateManyNoMatch(res: Response, t: TFunction) {
        return res
            .status(200)
            .json({
                success: false,
                status: "fail",
                message: t("no_matched_documents"),
                modifiedCount: 0,
            });
    }

    updateMany(res: Response, t: TFunction, document: any) {
        return res
            .status(200)
            .json({
                success: true,
                status: "success",
                message: t("updated_successfully"),
                document,
            });
    }

    success(res: Response, t: TFunction, status: number, messageKey: string, data?: any) {
        return res
            .status(status)
            .json({ success: true, status: "success", message: t(messageKey), data });
    }

    fail(res: Response, t: TFunction, status: number, messageKey: string, data?: any) {
        return res
            .status(status)
            .json({ success: false, status: "fail", message: t(messageKey), ...data });
    }
}

export default new ApiResponse();

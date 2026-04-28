import productService from "@modules/product/product.services";
import { GenericController } from "@shared/genericController";
import type { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";

export class ProductController extends GenericController<typeof productService> {
    constructor() {
        super(productService);
    }

    public importExcel = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        if (!req.file) {
            res.status(400).json({ success: false, message: "No file uploaded" });
            return;
        }
        const result = await productService.importFromExcel(req.file.buffer);
        res.status(200).json({ success: true, data: result });
    });

    public downloadImportTemplate = asyncHandler(async (_req: Request, res: Response) => {
        const workbook = await productService.generateImportTemplate();
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="bulk_product_template.xlsx"',
        );
        await workbook.xlsx.write(res);
        res.end();
    });
}

export default new ProductController();

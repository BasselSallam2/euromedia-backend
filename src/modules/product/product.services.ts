import { ProductModel } from "@/modules/product/product.schema";
import { GenericServices } from "@/services/genericServices";
import type { IProduct } from "@modules/product/product.interface";
import ExcelJS from "exceljs";
import { Model, Types } from "mongoose";

const IMPORT_HEADERS = [
    { header: "Product Name",    key: "name",          width: 30 },
    { header: "Brand ID",        key: "brandId",       width: 26 },
    { header: "Category ID",     key: "categoryId",    width: 26 },
    { header: "Model Number",    key: "modelNumber",   width: 18 },
    { header: "Print Head Type", key: "printHeadType", width: 18 },
    { header: "Print Head Qty",  key: "printHeadQty",  width: 16 },
    { header: "Max Resolution",  key: "maxResolution", width: 16 },
    { header: "Print Speed",     key: "printSpeed",    width: 16 },
    { header: "Max Print Width", key: "maxPrintWidth", width: 18 },
    { header: "Ink Type",        key: "inkType",       width: 14 },
    { header: "Weight (kg)",     key: "weight",        width: 13 },
    { header: "Image URLs",      key: "images",        width: 40 },
    { header: "Description",     key: "description",   width: 40 },
];

export class ProductService extends GenericServices<IProduct> {
    constructor(model: Model<IProduct>) {
        super(model);
    }

    public async importFromExcel(
        buffer: Buffer,
    ): Promise<{ successCount: number; failedRows: { row: number; error: string }[] }> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

        const worksheet = workbook.worksheets[0];

        // Track both the document to insert and its original Excel row number so
        // MongoBulkWriteError indices can be mapped back to human-readable row refs.
        const toInsert: Array<{ doc: Partial<IProduct>; rowNum: number }> = [];
        const failedRows: { row: number; error: string }[] = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;

            try {
                const cell = (col: number): string => {
                    const v = row.getCell(col).value;
                    if (v === null || v === undefined) return "";
                    if (typeof v === "object" && "text" in v) return String((v as any).text).trim();
                    if (typeof v === "object" && "result" in v) return String((v as any).result).trim();
                    return String(v).trim();
                };

                const name = cell(1);
                const brandId = cell(2);
                const categoryId = cell(3);

                if (!name) throw new Error("Missing product name");
                if (!Types.ObjectId.isValid(brandId))
                    throw new Error(`Invalid brand ID: "${brandId}"`);
                if (!Types.ObjectId.isValid(categoryId))
                    throw new Error(`Invalid category ID: "${categoryId}"`);

                const imagesRaw = cell(12);
                const images = imagesRaw
                    ? imagesRaw.split(",").map((u) => u.trim()).filter(Boolean)
                    : [];

                const weightRaw = cell(11);
                const weight = weightRaw ? Number(weightRaw) : undefined;

                toInsert.push({
                    doc: {
                        name,
                        brand: new Types.ObjectId(brandId),
                        category: new Types.ObjectId(categoryId),
                        modelNumber: cell(4) || undefined,
                        printHeadType: cell(5) || undefined,
                        printHeadQty: String(cell(6)) || undefined,
                        maxResolution: cell(7) || undefined,
                        printSpeed: cell(8) || undefined,
                        maxPrintWidth: cell(9) || undefined,
                        inkType: cell(10) || undefined,
                        weight: weight !== undefined && !isNaN(weight) ? weight : undefined,
                        images,
                        description: cell(13) || undefined,
                        metadata: {},
                    },
                    rowNum: rowNumber,
                });
            } catch (err: any) {
                failedRows.push({ row: rowNumber, error: err.message });
            }
        });

        let successCount = 0;

        if (toInsert.length > 0) {
            try {
                const inserted = await ProductModel.insertMany(
                    toInsert.map((t) => t.doc),
                    { ordered: false },
                );
                successCount = inserted.length;
            } catch (err: any) {
                // ordered:false → MongoDB throws MongoBulkWriteError even when
                // some documents inserted successfully. Recover the partial count
                // and map write-error indices back to original Excel row numbers.
                if (err.name === "MongoBulkWriteError") {
                    successCount =
                        err.insertedDocs?.length ??
                        err.result?.insertedCount ??
                        0;
                    for (const we of err.writeErrors ?? []) {
                        const originalRow = toInsert[we.index]?.rowNum ?? we.index + 2;
                        failedRows.push({
                            row: originalRow,
                            error: we.errmsg || we.message || "Database write error",
                        });
                    }
                } else {
                    throw err;
                }
            }
        }

        return { successCount, failedRows };
    }

    public async generateImportTemplate(): Promise<ExcelJS.Workbook> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Products");

        worksheet.columns = IMPORT_HEADERS;

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4F81BD" },
        };
        headerRow.alignment = { horizontal: "center", vertical: "middle" };
        headerRow.height = 20;

        // Example row so admins can see the expected format in every column
        worksheet.addRow({
            name: "Example Product",
            brandId: "<paste Brand ObjectId here>",
            categoryId: "<paste Category ObjectId here>",
            modelNumber: "MODEL-001",
            printHeadType: "Thermal",
            printHeadQty: "4",
            maxResolution: "1200dpi",
            printSpeed: "50m/h",
            maxPrintWidth: "1600mm",
            inkType: "UV",
            weight: 25.5,
            images: "https://cdn.example.com/img1.jpg,https://cdn.example.com/img2.jpg",
            description: "Full product description goes here",
        });

        return workbook;
    }
}

export default new ProductService(ProductModel);

import { clearByPattern } from "@/cache/cacheHelper";
import ApiFeature, { buildMongoFilterFromQuery } from "@/utils/apiFeatures";
import ExcelJS from 'exceljs';
import type { PopulateOptions } from "mongoose";
import { Model } from "mongoose";
import arabicMapping from "../../translation/excelsheet.translation.json";


class GenericServices<T> {
    model: Model<T>;
    modelName: string;
    constructor(model: Model<T>) {
        this.model = model;
        this.modelName = model.modelName;
    }

    public async deleteById(id: string) {
        const cachePattern = `*${this.model.modelName}:${id}:*`;
        await clearByPattern(cachePattern);

        if (this.model.schema.paths.deleted) {
            return this.model.findByIdAndUpdate(id, {
                deleted: true,
            });
        } else {
            return this.model.findByIdAndDelete(id);
        }
    }

    public deleteMany(fillter: any) {
        const query = this.model.deleteMany(fillter);
        return query;
    }

    public async updateById(id: string, body: any, ...args: any[]) {
        const cachePattern = `*${this.model.modelName}:${id}:*`;
        await clearByPattern(cachePattern);
        const query = await this.model.findByIdAndUpdate(id, body, { new: true }).exec();
        return query;
    }

    public updateMany(filter: any, body: any) {
        const query = this.model.updateMany(filter, body);
        return query;
    }

    public createOne(body: any, ...args: any[]): any {
        const query = this.model.create(body);
        return query;
    }

    public createMany(body: any) {
        return this.model.create(body);
    }

    public async getOne(
        id: string,
        options?: {
            populateOption?: any;
            sanitizeOption?: string[];
            selectOption?: string[];
            cache?: string;
        },
    ) {
        const { populateOption, sanitizeOption, selectOption, cache } = options || {};
        const chacheKey = `${this.model.modelName}:${id}:${JSON.stringify(populateOption)}`;
        let query = this.model.findOne({ _id: id });

        if (selectOption) {
            query = query.select(selectOption);
        }

        if (populateOption) {
            query = query.populate(populateOption);
        }

        if (sanitizeOption) {
            let sanatizeStr = sanitizeOption.map((f) => `${f}`).join(" ");
            query = query.select(sanatizeStr || "-__v");
        }

        if (cache === "yes") {
            return query.lean().cache("10 minutes", chacheKey).exec();
        }
        return query.lean().exec();
    }

    public async getAll(
        reqQuery: any,
        populateOption?: PopulateOptions | PopulateOptions[],
        sanitizeOption?: string[],
        reqFilter: Record<string, any> = {},
        args?: any,
    ) {
        try {
        const { searchBy } = reqQuery;
        const parsedQuery = buildMongoFilterFromQuery(reqQuery);
        let deletedFilter = {};
        if(this.model.schema.paths.deleted){
            deletedFilter = {deleted: false};
        }
            let documentsCount = 0;
            if (reqQuery.cache && reqQuery.cache === "true") {
                documentsCount = await this.model.countDocuments({...reqFilter , ...parsedQuery, ...deletedFilter});
            } else {
                documentsCount = await this.model.countDocuments({...reqFilter , ...parsedQuery, ...deletedFilter});
            }
            let query ;
            query = this.model.find({...deletedFilter});
            if (populateOption) {
                query = query.populate(populateOption);
            }

            const { MongooseQuery, paginationResult } = new ApiFeature(query, reqQuery)
                .search(searchBy?.split(",") || [])
                .filter(reqFilter)
                .sort()
                .sanitize(sanitizeOption)
                .select()
                .paginate(documentsCount);
            let documents = [];
            if (reqQuery.cache && reqQuery.cache === "true") {
                documents = (await MongooseQuery.lean().cache().exec()) as any[];
            } else {
                documents = (await MongooseQuery.lean().exec()) as any[];
            }
            return { documents, paginationResult };
        } catch (error) {
            throw error;
        }
    }

    public async exportExcel(sheetName: string, filter?: any) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);
    
        // 1. DYNAMIC POPULATION
        const pathsToPopulate = [];
        this.model.schema.eachPath((path, schemaType) => {
            if (schemaType.options.ref || (schemaType.instance === 'Array' && schemaType.options.ref)) {
                pathsToPopulate.push(path);
            }
        });
    
        const rawData = await this.model.find(filter || {}).populate(pathsToPopulate);
    
        if (!rawData || rawData.length === 0) return workbook;
    
        // Convert Mongoose documents to plain objects
        const data = rawData.map(item => item.toObject({ virtuals: false }));
    
        // 2. DEFINE COLUMNS WITH ARABIC MAPPING
        // We map the keys from the first object to the headers in your JSON
        const columns = Object.keys(data[0]).map(key => ({
            header: arabicMapping[key] || key, // Use Arabic from JSON, fallback to English Key
            key: key,                          // Internal key used to bind data
            width: 25
        }));
        worksheet.columns = columns;
    
        // 3. ROW PROCESSING
        data.forEach(item => {
            const rowValue = {};
    
            // Format each value (dates, arrays, populated objects)
            Object.keys(item).forEach(key => {
                rowValue[key] = this.formatValue(item[key]);
            });
    
            const row = worksheet.addRow(rowValue);
            
            // Styling the row for Arabic readability
            row.alignment = { 
                vertical: 'top', 
                wrapText: true, 
                horizontal: 'right' // Align text to the right for Arabic
            };
        });
    
        // 4. STYLING & SETTINGS
        // Set the worksheet to Right-To-Left
        worksheet.views = [{ rightToLeft: true }];
    
        // Style the Header Row (Row 1)
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' } // Professional blue background
        };
        headerRow.alignment = { horizontal: 'center' };
    
        return workbook;
    }
    private formatValue(val: any): any {
        if (val === null || val === undefined) return "";
    
        // Handle Arrays (like addOns or variance)
        if (Array.isArray(val)) {
            return val.map(item => this.formatValue(item)).join(", \n");
        }
    
        // Handle Populated Objects
        if (typeof val === 'object' && !(val instanceof Date)) {
            // If it's a populated Mongoose object, try to find a "human" name
            if (val.name) return val.name;
            if (val.title) return val.title;
            if (val.label) return val.label;
            
            // If it's a sub-object (like variance items), stringify it neatly
            return JSON.stringify(val).replace(/["{}]/g, ""); 
        }
    
        return val;
    }
}

export { GenericServices };

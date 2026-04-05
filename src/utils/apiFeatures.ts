import { Query } from "mongoose";

const QUERY_OPERATORS = ["gte", "gt", "lte", "lt", "ne", "eq", "in", "nin"] as const;
const QUERY_OPERATORS_SET = new Set<string>(QUERY_OPERATORS);
export const DEFAULT_EXCLUDED_QUERY_FIELDS = [
    "page",
    "sort",
    "limit",
    "fields",
    "populate",
    "searchBy",
    "keyword",
    "q",
    "search",
];

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const firstQueryString = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
        const first = value.find((v) => typeof v === "string");
        return typeof first === "string" ? first : "";
    }
    return "";
};

const normalizeInValue = (value: any) => {
    if (Array.isArray(value)) {
        return value;
    }
    if (typeof value === "string") {
        return value
            .split(/,|،/)
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);
    }
    if (value === undefined || value === null) {
        return [];
    }
    return [value];
};

const convertOperatorObject = (value: any): any => {
    if (Array.isArray(value)) {
        return value.map((item) => convertOperatorObject(item));
    }

    if (!value || typeof value !== "object") {
        return value;
    }

    return Object.entries(value).reduce<Record<string, any>>((acc, [key, rawValue]) => {
        const isOperator = QUERY_OPERATORS_SET.has(key);
        const mongoKey = isOperator ? `$${key}` : key;
        const convertedValue = convertOperatorObject(rawValue);

        if (isOperator && (key === "in" || key === "nin")) {
            acc[mongoKey] = normalizeInValue(convertedValue);
            return acc;
        }

        acc[mongoKey] = convertedValue;
        return acc;
    }, {});
};

export const buildMongoFilterFromQuery = (
    query: Record<string, any>,
    excludedFields: string[] = DEFAULT_EXCLUDED_QUERY_FIELDS,
) => {
    const queryObj: Record<string, any> = { ...query };
    excludedFields.forEach((field) => delete queryObj[field]);

    // Supports query parser modes that keep keys like `field[gt]` as raw strings.
    Object.entries(queryObj).forEach(([key, value]) => {
        const bracketOperatorMatch = key.match(
            new RegExp(`^(.+)\\[(${QUERY_OPERATORS.join("|")})\\](?:\\[\\])?$`),
        );
        if (!bracketOperatorMatch) return;

        const [, field, operator] = bracketOperatorMatch;
        const currentValue = queryObj[field];
        const asObject =
            currentValue && typeof currentValue === "object" && !Array.isArray(currentValue)
                ? currentValue
                : {};
        queryObj[field] = { ...asObject, [operator]: value };
        delete queryObj[key];
    });

    return convertOperatorObject(queryObj);
};

type paginateOBJ = {
    count: number;
    page: number;
    limit: number;
    pages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
    lastPage: number;
    status: string;
    success: boolean;
};

class ApiFeature {
    private excludedFields: string[] = [];
    private searchConditions: any = null;
    constructor(public MongooseQuery: Query<any, any>, public queryStr: Record<string, any>) {
        this.MongooseQuery = MongooseQuery;
        this.queryStr = queryStr;
    }

    public paginationResult: paginateOBJ = {
        count: 0,
        page: 1,
        limit: 1,
        pages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: 0,
        prevPage: 0,
        lastPage: 0,
        status: "",
        success: false,
    };

    filter(reqFilter: Record<string, any> = {}) {
        const parsedQuery = buildMongoFilterFromQuery(this.queryStr);
        const filterOnly: Record<string, any> = { ...parsedQuery, ...reqFilter };

        let finalConditions: Record<string, any>;
        if (this.searchConditions) {
            finalConditions =
                Object.keys(filterOnly).length > 0
                    ? { $and: [this.searchConditions, filterOnly] }
                    : this.searchConditions;
        } else {
            finalConditions = filterOnly;
        }

        this.MongooseQuery = this.MongooseQuery.find(finalConditions);

        return this;
    }

    sort() {
        if (this.queryStr.sort) {
            const sortBy = this.queryStr.sort.split(",").join(" ");
            this.MongooseQuery = this.MongooseQuery.sort(sortBy);
        } else {
            this.MongooseQuery = this.MongooseQuery.sort("-createdAt");
        }
        return this;
    }

    sanitize(fields: string[] | undefined) {
        if (!fields) return this;
        this.excludedFields = fields;
        return this;
    }

    select() {
        if (this.queryStr.fields) {
            const fields = this.queryStr.fields.split(",").join(" ");
            this.MongooseQuery = this.MongooseQuery.select(`${fields} `);
        } else {
            const excludeStr = this.excludedFields.map((f) => `-${f}`).join(" ");
            this.MongooseQuery = this.MongooseQuery.select(`-__v ${excludeStr}`);
        }
        return this;
    }

    search(fields: string[]) {
        const raw =
            firstQueryString(this.queryStr.keyword) ||
            firstQueryString(this.queryStr.q) ||
            firstQueryString(this.queryStr.search);
        const keyword = raw.trim();

        if (keyword && fields.length > 0) {
            this.searchConditions = {
                $or: fields.map((field) => ({
                    [field]: {
                        $regex: escapeRegex(keyword),
                        $options: "i",
                    },
                })),
            };
        }
        return this;
    }

    paginate(countDocuments: number) {
        const page = Math.max(parseInt(this.queryStr.page) || 1, 1);
        const requestedLimit = parseInt(this.queryStr.limit);
        const limit = requestedLimit === 0 ? countDocuments : Math.max(requestedLimit || 20, 1);

        const adjustedLimit = Math.min(limit, countDocuments);

        const skip = (page - 1) * adjustedLimit;
        const endIndex = page * adjustedLimit;

        const pagination: paginateOBJ = {
            count: countDocuments,
            page,
            limit: adjustedLimit,
            pages: Math.ceil(countDocuments / adjustedLimit),
            hasNextPage: endIndex < countDocuments,
            hasPrevPage: page > 1,
            nextPage: endIndex < countDocuments ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null,
            lastPage: Math.ceil(countDocuments / adjustedLimit),
            status: "success",
            success: true,
        };

        this.MongooseQuery = this.MongooseQuery.skip(skip).limit(adjustedLimit);
        this.paginationResult = pagination;

        return this;
    }
}

// Utility function for applying ApiFeatures with custom post-processing
export async function applyApiFeaturesWithPostProcessing<T>(
    mongooseQuery: Query<any, any>,
    reqQuery: Record<string, any>,
    totalCount: number,
    postProcessFn?: (items: T[]) => any[],
    searchFields: string[] = ['name', 'description'],
    customFieldMappings: Record<string, string> = {},
    baseFilter: Record<string, any> = {}
) {
    try {
        // Handle custom field mappings (like categoryId -> category)
        const modifiedReqQuery = { ...reqQuery };
        Object.entries(customFieldMappings).forEach(([queryParam, dbField]) => {
            if (modifiedReqQuery[queryParam]) {
                modifiedReqQuery[dbField] = modifiedReqQuery[queryParam];
                delete modifiedReqQuery[queryParam];
            }
        });

        // Apply ApiFeatures
        const { MongooseQuery, paginationResult } = new ApiFeature(mongooseQuery, modifiedReqQuery)
            .search(modifiedReqQuery.searchBy?.split(",") || searchFields)
            .filter(baseFilter)
            .sort()
            .select()
            .paginate(totalCount);

        // Execute query
        const documents = (await MongooseQuery.lean().exec()) as T[];

        // Apply post-processing if provided
        const processedDocuments = postProcessFn ? postProcessFn(documents) : documents;

        return {
            documents: processedDocuments,
            paginationResult
        };
    } catch (error) {
        throw error;
    }
}

export default ApiFeature;

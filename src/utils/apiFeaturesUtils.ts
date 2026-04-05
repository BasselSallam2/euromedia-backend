import ApiFeature from "@/utils/apiFeatures";
import { Query } from "mongoose";


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
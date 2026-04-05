export const paginateAggregation = async (mongoAggregation: any, countDocuments: any, query: any) => {

    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.max(parseInt(query.limit) || 20, 1); 
    const skip = (page - 1) * limit;

    const totalPages = Math.ceil(countDocuments / limit);
    const endIndex = page * limit;

    const paginationResult = {
        count: countDocuments,
        page,
        limit,
        pages: totalPages,
        hasNextPage: endIndex < countDocuments,
        hasPrevPage: page > 1,
        nextPage: endIndex < countDocuments ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
    };
  
    const results = await mongoAggregation.skip(skip).limit(limit).exec();

   
    return { results, paginationResult };
};
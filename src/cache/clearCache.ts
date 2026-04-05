import apiResponse from "@/utils/apiResponse";
import type { Request, Response } from "express";
import { cache } from "./init";

export const clearCache = async (req: Request, res: Response) => {
    cache.clear();
    return apiResponse.success(res, req.t, 200, "cache_cleared");
};

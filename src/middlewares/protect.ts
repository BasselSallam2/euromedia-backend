
import { UserModel } from "@/modules/user/user.schema";
import { ApiError } from "@utils/apiError";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Model } from "mongoose";



type Token<T = undefined> = string | T;
function GetToken<T = any>(req: Request): Token<T> {
    const cookieToken = req.cookies.accessToken;
    if (cookieToken) return `Bearer ${cookieToken}` as Token<T>;
    return (req.headers["Authorization"] || req.headers["authorization"]) as Token<T>;
}

const verifyToken = async (token: string, req: Request) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
        throw new ApiError(401, "errors.login.UNAUTHORIZED", {}, "clearToken");
    }
};

const protect =  async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const ReqToken = GetToken(req);
            const token = ReqToken?.split(" ")[1];
            if (!ReqToken || !token)
                throw new ApiError(401, "errors.login.UNAUTHORIZED", {}, "clearToken");

            const decoded = await verifyToken(token, req);
            const { _id } = decoded as { _id: string };
            let user: any;
           user = await UserModel.findById(_id) 
            .select("name role")
            .populate("role")
            .lean()
            .exec() as any ;

            if (!user) throw new ApiError(401, "errors.login.USER_NOT_FOUND", req.t);
            
            req.user = {name:user.name , _id:user._id, permissions:user.role?.permissions};
            next();
        } catch (error) {
            next(error);
        }
    };

const allowedWith =
    (...Allowedpermissions: string[]) =>
    async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const { permissions } = req.user as { permissions: string[] };
            if (!Allowedpermissions.every((p) => permissions?.includes(p)))
                throw new ApiError(403, "errors.forbidden", req.t);
            next();
        } catch (error) {
            next(error);
            return;
        }
    };

export { allowedWith, protect };

import { ApiError } from "@/utils/apiError";
import bcrypt from "bcryptjs";
import type { TFunction } from "i18next";
import jwt from "jsonwebtoken";
import { Model, Types } from "mongoose";
import type { IUser } from "../user.interface";
import { UserModel } from "../user.schema";
import { UserService } from "../user.services";


const tokenTTL = "180d";
class AuthService extends UserService {
    constructor(model: Model<IUser>) {
        super(model);
    }
    public async signin(email: string, password: string, t: TFunction) {
        const user = await UserModel.findOne({ email })
            .select("email password")
            .lean()
            .exec();
        if (!user) {
            throw new ApiError(401, "errors.login.INVALID_CREDENTIALS", t);
        }
        const PasswordIsCorrect = await bcrypt.compare(password, user.password);
        if (!PasswordIsCorrect) {
            throw new ApiError(401, "errors.login.INVALID_CREDENTIALS", t);
        }
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET as string, { expiresIn: tokenTTL });
        return token;
    }
    
    async getMe(userId: Types.ObjectId) {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new ApiError(404, "errors.USER_NOT_FOUND");
        }
        return { user };
    }

}


export default new AuthService(UserModel);

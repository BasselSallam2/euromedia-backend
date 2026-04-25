import { UserModel } from "@/modules/user/user.schema";
import { ApiError } from "@/utils/apiError";
import { GenericServices } from "@/services/genericServices";
import type { IUser } from "@modules/user/user.interface";
import { RoleModel } from "@modules/role/role.schema";
import { Model, Types } from "mongoose";
export class UserService extends GenericServices<IUser> {
    constructor(model: Model<IUser>) {
        super(model);
    }

    // async createAddress(userId: string, address: IAddress) {
    //     const user = await UserModel.findById(userId);
    //     if (!user) {
    //         throw new ApiError(404, "errors.USER_NOT_FOUND");
    //     }
    //     user.addresses.push(address);
    //     await user.save();
    //     return user;
    // }

    // async deleteAddress(userId: string, addressId: string) {
    //     await UserModel.updateOne({ _id: userId }, { $pull: { addresses: { _id: addressId } } });
    //     return true;
    // }

    // async getAddresses(userId: string) {
    //     const user = await UserModel.findById(userId).select("addresses");
    //     if (!user) {
    //         throw new ApiError(404, "errors.USER_NOT_FOUND");
    //     }
    //     return user.addresses;
    // }
    
    // async editAddress(userId: string, addressId: string, address: IAddress) {
    //     await UserModel.updateOne({ _id: userId, "addresses._id": addressId }, { $set: { "addresses.$.address": address.address, "addresses.$.appartmentNumber": address.appartmentNumber, "addresses.$.city": address.city, "addresses.$.area": address.area, "addresses.$.location": address.location } });
    //     return true;
    // }

    async createAdmin(data: any) {
        const adminRole = await RoleModel.findOne({ name: "Super Admin" });
        if (!adminRole) throw new ApiError(500, "Super Admin role not found. Run seeders first.");
        return this.model.create({ ...data, role: adminRole._id });
    }

}

export default new UserService(UserModel);
import { UserModel } from "@/modules/user/user.schema";
import { permissions } from "@/utils/interfaces";
import { RoleModel } from "@modules/role/role.schema";
import dotenv from "dotenv";
dotenv.config();
//

const seedAdminRole = async () => {
    const adminRole = await RoleModel.findOne({ name: "Super Admin" });
    if (adminRole) {
        if (
            adminRole.permissions.length !== Object.values(permissions).length
        ) {
            await adminRole.updateOne({
                permissions: Object.values(permissions),
            });
        }
        return;
    } else {
        await RoleModel.create({
            name: "Super Admin",
            permissions: Object.values(permissions),
        });
    }
};

const seedAdminUser = async () => {
    const adminUser = await UserModel.findOne({
        phoneNumber: process.env.ADMIN_PHONE_NUMBER,
    });
    if (adminUser) {
        return;
    } else {
        const adminRole = await RoleModel.findOne({ name: "Super Admin" });
        await UserModel.create({
            name: "Admin",
            phoneNumber: process.env.ADMIN_PHONE_NUMBER,
            password: process.env.ADMIN_PASSWORD,
            role: adminRole._id,
            email: process.env.ADMIN_EMAIL,
        });
    }
};

export { seedAdminRole, seedAdminUser };

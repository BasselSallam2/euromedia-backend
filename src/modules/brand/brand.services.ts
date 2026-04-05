import { BrandModel } from "@/modules/brand/brand.schema";
import { GenericServices } from "@/services/genericServices";
import type { IBrand } from "@modules/brand/brand.interface";
import { Model } from "mongoose";
export class BrandService extends GenericServices<IBrand> {
    constructor(model: Model<IBrand>) {
        super(model);
    }


}

export default new BrandService(BrandModel);
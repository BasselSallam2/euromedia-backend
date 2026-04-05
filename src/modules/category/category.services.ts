import { CategoryModel } from "@/modules/category/category.schema";
import { GenericServices } from "@/services/genericServices";
import type { ICategory } from "@modules/category/category.interface";
import { Model } from "mongoose";
export class CategoryService extends GenericServices<ICategory> {
    constructor(model: Model<ICategory>) {
        super(model);
    }


}

export default new CategoryService(CategoryModel);
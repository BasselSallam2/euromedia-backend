import { ProductModel } from "@/modules/product/product.schema";
import { GenericServices } from "@/services/genericServices";
import type { IProduct } from "@modules/product/product.interface";
import { Model } from "mongoose";
export class ProductService extends GenericServices<IProduct> {
    constructor(model: Model<IProduct>) {
        super(model);
    }


}

export default new ProductService(ProductModel);
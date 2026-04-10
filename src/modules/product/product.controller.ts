import productService from "@modules/product/product.services";
import { GenericController } from "@shared/genericController";


export class ProductController extends GenericController<typeof productService> {
    constructor() {
        super(productService);

    }

}

export default new ProductController();
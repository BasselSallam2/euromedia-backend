import categoryService from "@modules/category/category.services";
import { GenericController } from "@shared/genericController";


export class CategoryController extends GenericController<typeof categoryService> {
    constructor() {
        super(categoryService);
       
    }

}

export default new CategoryController();
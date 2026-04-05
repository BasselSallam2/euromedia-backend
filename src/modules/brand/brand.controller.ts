import brandService from "@modules/brand/brand.services";
import { GenericController } from "@shared/genericController";


export class BrandController extends GenericController<typeof brandService> {
    constructor() {
        super(brandService);
       
    }

}

export default new BrandController();
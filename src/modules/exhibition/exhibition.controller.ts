import exhibitionService from "@modules/exhibition/exhibition.services";
import { GenericController } from "@shared/genericController";


export class ExhibitionController extends GenericController<typeof exhibitionService> {
    constructor() {
        super(exhibitionService);
       
    }

}

export default new ExhibitionController();
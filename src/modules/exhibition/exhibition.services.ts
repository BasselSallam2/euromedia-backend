import { ExhibitionModel } from "@/modules/exhibition/exhibition.schema";
import { GenericServices } from "@/services/genericServices";
import type { IExhibition } from "@modules/exhibition/exhibition.interface";
import { Model } from "mongoose";
export class ExhibitionService extends GenericServices<IExhibition> {
    constructor(model: Model<IExhibition>) {
        super(model);
    }


}

export default new ExhibitionService(ExhibitionModel);
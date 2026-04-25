import { CustomerModel } from "./customer.schema";
import { GenericServices } from "@/services/genericServices";
import type { ICustomer } from "./customer.interface";
import { Model } from "mongoose";

export class CustomerService extends GenericServices<ICustomer> {
    constructor(model: Model<ICustomer>) {
        super(model);
    }
}

export default new CustomerService(CustomerModel);

import customerService from "./customer.services";
import { GenericController } from "@shared/genericController";

export class CustomerController extends GenericController<typeof customerService> {
    constructor() {
        super(customerService);
    }
}

export default new CustomerController();

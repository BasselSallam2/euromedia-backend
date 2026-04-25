import { OrderModel } from "./order.schema";
import { GenericServices } from "@/services/genericServices";
import type { IOrder } from "./order.interface";
import { ApiError } from "@/utils/apiError";
import { Model } from "mongoose";

export class OrderService extends GenericServices<IOrder> {
    constructor(model: Model<IOrder>) {
        super(model);
    }

    async createOne(body: any): Promise<IOrder> {
        let { orderNumber } = body;

        if (orderNumber) {
            const existingOrder = await this.model.findOne({ orderNumber });
            if (existingOrder) {
                throw new ApiError(400, "Order number already exists");
            }
        } else {
            orderNumber = `EM-${Date.now()}`;
        }

        body.orderNumber = orderNumber;
        return super.createOne(body);
    }
}

export default new OrderService(OrderModel);

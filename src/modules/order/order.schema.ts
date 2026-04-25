import { Schema, model } from "mongoose";
import type { IOrder } from "./order.interface";

const orderSchema = new Schema<IOrder>(
    {
        orderNumber: { type: String, required: true, unique: true },
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
                productName: { type: String, required: true },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
            },
        ],
        totalPrice: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        madeBy: { type: String, required: true },
        companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    },
    {
        timestamps: true,
    }
);

export const OrderModel = model<IOrder>("Order", orderSchema);

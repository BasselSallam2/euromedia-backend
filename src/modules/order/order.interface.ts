import { Document, Types } from "mongoose";

export interface IOrderItem {
    productId: Types.ObjectId;
    productName: string;
    quantity: number;
    price: number;
}

export interface IOrder extends Document {
    orderNumber: string;
    items: IOrderItem[];
    totalPrice: number;
    date: Date;
    madeBy: string; // user.email
    companyId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

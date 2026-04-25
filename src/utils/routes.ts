import { allowedWith, protect } from "@/middlewares/protect";
import { permissions } from "@/utils/interfaces";
import { clearCache } from "@cache/clearCache";
import uploadRouter from "@modules/upload/upload.route";
import userRouter from "@modules/user/user.route";
import brandRouter from "@modules/brand/brand.route";
import categoryRouter from "@modules/category/category.route";
import productRouter from "@modules/product/product.route";
import exhibitionRouter from "@modules/exhibition/exhibition.route";
import chatbotRouter from "@modules/chatbot/chatbot.route";
import contactRouter from "@modules/contact/contact.route";
import companyRouter from "@modules/company/company.route";
import customerRouter from "@modules/customer/customer.route";
import orderRouter from "@modules/order/order.route";
import { Router } from "express";

const router = Router();

router.use("/user", userRouter);
router.use("/brand", brandRouter);
router.use("/category", categoryRouter);
router.use("/product", productRouter);
router.use("/exhibition", exhibitionRouter);
router.use("/upload", uploadRouter);
router.use("/contact", contactRouter);
router.use("/chatbot", chatbotRouter);
router.use("/company", companyRouter);
router.use("/customer", customerRouter);
router.use("/order", orderRouter);
router.get("/clearCache", protect, allowedWith(permissions.CACHECLEAR), clearCache);

export default router;

import { allowedWith, protect } from "@/middlewares/protect";
import { permissions } from "@/utils/interfaces";
import { clearCache } from "@cache/clearCache";
import userRouter from "@modules/user/user.route";
import brandRouter from "@modules/brand/brand.route";
import categoryRouter from "@modules/category/category.route";
import productRouter from "@modules/product/product.route";
import exhibitionRouter from "@modules/exhibition/exhibition.route";
import { Router } from "express";

const router = Router();

router.use("/user", userRouter);
router.use("/brand", brandRouter);
router.use("/category", categoryRouter);
router.use("/product", productRouter);
router.use("/exhibition", exhibitionRouter);
router.get("/clearCache", protect, allowedWith(permissions.CACHECLEAR), clearCache);

export default router;

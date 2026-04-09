import { protect, allowedWith } from "@/middlewares/protect";
import ProductController from "@modules/product/product.controller";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
const router = Router();

router.route("/")
    .post(protect, allowedWith(permissions.PRODUCTCREATE), ProductController.createOne)
    // .get(protect, allowedWith(permissions.PRODUCTREAD), ProductController.getAll );
    .get(ProductController.getAll);

router
    .route("/:id")
    // .get(protect, allowedWith(permissions.PRODUCTREAD), ProductController.getOne)
    .get(ProductController.getOne)
    .get(protect, allowedWith(permissions.PRODUCTREAD), ProductController.getOne)
    .put(protect, allowedWith(permissions.PRODUCTUPDATE), ProductController.updateById)
    .delete(protect, allowedWith(permissions.PRODUCTDELETE), ProductController.deleteById);

export default router;
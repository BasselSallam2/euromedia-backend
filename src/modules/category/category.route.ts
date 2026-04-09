import { protect, allowedWith } from "@/middlewares/protect";
import CategoryController from "@modules/category/category.controller";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
const router = Router();

router.route("/")
    .post(protect, allowedWith(permissions.CATEGORYCREATE), CategoryController.createOne)
    // .get(protect, allowedWith(permissions.CATEGORYREAD), CategoryController.getAll);
    .get(CategoryController.getAll);
router
    .route("/:id")
    // .get(protect, allowedWith(permissions.CATEGORYREAD), CategoryController.getOne)
    .get(CategoryController.getOne)
    .put(protect, allowedWith(permissions.CATEGORYUPDATE), CategoryController.updateById)
    .delete(protect, allowedWith(permissions.CATEGORYDELETE), CategoryController.deleteById);

export default router;
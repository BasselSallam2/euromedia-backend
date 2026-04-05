import {protect , allowedWith } from "@/middlewares/protect";
import BrandController from "@modules/brand/brand.controller";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
const router = Router();

router.route("/")
.post(protect, BrandController.createOne)
.get(protect, allowedWith(permissions.BRANDREAD), BrandController.getAll);

router
    .route("/:id")
    .get(protect, allowedWith(permissions.BRANDREAD), BrandController.getOne)
    .put(protect, allowedWith(permissions.BRANDUPDATE), BrandController.updateById)
    .delete(protect, allowedWith(permissions.BRANDDELETE), BrandController.deleteById);

export default router;
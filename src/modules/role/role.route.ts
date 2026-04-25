import { protect, allowedWith } from "@/middlewares/protect";
import RoleController from "@modules/role/role.controller";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
const router = Router();

router.route("/export").get(protect, allowedWith(permissions.ROLEREAD), RoleController.exportExcel);

router.route("/")
    .post(protect, allowedWith(permissions.ROLECREATE), RoleController.createOne)
    .get(protect, allowedWith(permissions.ROLEREAD), RoleController.getAll);

router
    .route("/:id")
    .get(protect, allowedWith(permissions.ROLEREAD), RoleController.getOne)
    .put(protect, allowedWith(permissions.ROLEUPDATE), RoleController.updateById)
    .delete(protect, allowedWith(permissions.ROLEDELETE), RoleController.deleteById);

export default router;
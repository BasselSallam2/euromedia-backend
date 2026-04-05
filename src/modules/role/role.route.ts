import {protect , allowedWith } from "@/middlewares/protect";
import RoleController from "@modules/role/role.controller";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
import { StaffModel } from "../staff/staff.schema";
const router = Router();

router.route("/export").get(protect(StaffModel), allowedWith(permissions.ROLEREAD), RoleController.exportExcel);

router.route("/")
.post(protect(StaffModel), allowedWith(permissions.ROLECREATE), RoleController.createOne)
.get(protect(StaffModel), allowedWith(permissions.ROLEREAD), RoleController.getAll);

router
    .route("/:id")
    .get(protect(StaffModel), allowedWith(permissions.ROLEREAD), RoleController.getOne)
    .put(protect(StaffModel), allowedWith(permissions.ROLEUPDATE), RoleController.updateById)
    .delete(protect(StaffModel), allowedWith(permissions.ROLEDELETE), RoleController.deleteById);

export default router;
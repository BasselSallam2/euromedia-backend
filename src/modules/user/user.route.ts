import {protect , allowedWith } from "@/middlewares/protect";
import UserController from "@modules/user/user.controller";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
import authRouter from "./Auth/user.auth.routes";
import { UserModel } from "./user.schema";
const router = Router();

router.use("/auth", authRouter);

router.route("/")
.get(protect, allowedWith(permissions.USERREAD), UserController.getAll);

router
    .route("/:id")
    .get(UserController.getOne)
    .put(UserController.updateById)
    .delete( protect, allowedWith(permissions.USERDELETE), UserController.deleteById);

export default router;
import { protect, allowedWith } from "@/middlewares/protect";
import UserController from "@modules/user/user.controller";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
import authRouter from "./Auth/user.auth.routes";
const router = Router();

router.use("/auth", authRouter);

router.route("/")
    .get(protect, allowedWith(permissions.USERREAD), UserController.getAll)
    .post(protect, allowedWith(permissions.USERCREATE), UserController.createAdmin);

router
    .route("/:id")
    .get(protect, allowedWith(permissions.USERREAD), UserController.getOne)
    .put(protect, allowedWith(permissions.USERUPDATE), UserController.updateById)
    .delete(protect, allowedWith(permissions.USERDELETE), UserController.deleteById);

export default router;
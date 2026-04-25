import { protect, allowedWith } from "@/middlewares/protect";
import OrderController from "./order.controller";
import { orderValidation } from "./order.validation";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
const router = Router();

router.route("/")
    .post(protect, allowedWith(permissions.ORDERCREATE), orderValidation, OrderController.createOne)
    .get(protect, allowedWith(permissions.ORDERREAD), OrderController.getAll);

router.route("/:id")
    .get(protect, allowedWith(permissions.ORDERREAD), OrderController.getOne)
    .put(protect, allowedWith(permissions.ORDERUPDATE), OrderController.updateById)
    .delete(protect, allowedWith(permissions.ORDERDELETE), OrderController.deleteById);

export default router;

import { protect, allowedWith } from "@/middlewares/protect";
import CustomerController from "./customer.controller";
import { customerValidation } from "./customer.validation";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
const router = Router();

router.route("/")
    .post(protect, allowedWith(permissions.CUSTOMERCREATE), customerValidation, CustomerController.createOne)
    .get(protect, allowedWith(permissions.CUSTOMERREAD), CustomerController.getAll);

router.route("/:id")
    .get(protect, allowedWith(permissions.CUSTOMERREAD), CustomerController.getOne)
    .put(protect, allowedWith(permissions.CUSTOMERUPDATE), CustomerController.updateById)
    .delete(protect, allowedWith(permissions.CUSTOMERDELETE), CustomerController.deleteById);

export default router;

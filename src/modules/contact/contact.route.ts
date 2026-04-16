import { protect, allowedWith } from "@/middlewares/protect";
import ContactController from "@modules/contact/contact.controller";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
const router = Router();

// Public route for form submission
router.post("/send", ContactController.send);

router.route("/")
    .post(protect, allowedWith(permissions.CONTACTCREATE), ContactController.createOne)
    .get(protect, allowedWith(permissions.CONTACTREAD), ContactController.getAll);

router
    .route("/:id")
    .get(protect, allowedWith(permissions.CONTACTREAD), ContactController.getOne)
    .put(protect, allowedWith(permissions.CONTACTUPDATE), ContactController.updateById)
    .delete(protect, allowedWith(permissions.CONTACTDELETE), ContactController.deleteById);

export default router;
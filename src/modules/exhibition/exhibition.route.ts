import { protect, allowedWith } from "@/middlewares/protect";
import ExhibitionController from "@modules/exhibition/exhibition.controller";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
const router = Router();

router.route("/")
    .post(protect, allowedWith(permissions.EXHIBITIONCREATE), ExhibitionController.createOne)
    // .get(protect, allowedWith(permissions.EXHIBITIONREAD), ExhibitionController.getAll);
    .get(ExhibitionController.getAll);
router
    .route("/:id")
    // .get(protect, allowedWith(permissions.EXHIBITIONREAD), ExhibitionController.getOne)
    .get(ExhibitionController.getOne)
    .put(protect, allowedWith(permissions.EXHIBITIONUPDATE), ExhibitionController.updateById)
    .delete(protect, allowedWith(permissions.EXHIBITIONDELETE), ExhibitionController.deleteById);

export default router;
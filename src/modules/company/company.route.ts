import { protect, allowedWith } from "@/middlewares/protect";
import CompanyController from "./company.controller";
import { captureLeadValidation, companyValidation } from "./company.validation";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
const router = Router();

// Public route for lead capture
router.post("/capture-lead", captureLeadValidation, CompanyController.captureLead);

// Self-branding (Euro Media's own company record)
router.get("/self", CompanyController.getSelf);
router.patch("/self/logo", protect, CompanyController.updateSelfLogo);

router.route("/")
    .post(protect, allowedWith(permissions.COMPANYCREATE), companyValidation, CompanyController.createOne)
    .get(protect, allowedWith(permissions.COMPANYREAD), CompanyController.getAll);

router.route("/:id")
    .get(protect, allowedWith(permissions.COMPANYREAD), CompanyController.getOne)
    .put(protect, allowedWith(permissions.COMPANYUPDATE), CompanyController.updateById)
    .delete(protect, allowedWith(permissions.COMPANYDELETE), CompanyController.deleteById);

export default router;

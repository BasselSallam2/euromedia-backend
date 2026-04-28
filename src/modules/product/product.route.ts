import { protect, allowedWith } from "@/middlewares/protect";
import ProductController from "@modules/product/product.controller";
import { Router } from "express";
import { permissions } from "@/utils/interfaces";
import multer from "multer";

const router = Router();

// 5 MB ceiling — generous for any realistic xlsx catalogue file
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Must be registered before /:id to avoid the param route swallowing "import"
router.get(
    "/import/template",
    protect,
    allowedWith(permissions.PRODUCTCREATE),
    ProductController.downloadImportTemplate,
);

router.post(
    "/import",
    protect,
    allowedWith(permissions.PRODUCTCREATE),
    upload.single("file"),
    ProductController.importExcel,
);

router.route("/")
    .post(protect, allowedWith(permissions.PRODUCTCREATE), ProductController.createOne)
    .get(ProductController.getAll);

router
    .route("/:id")
    .get(ProductController.getOne)
    .get(protect, allowedWith(permissions.PRODUCTREAD), ProductController.getOne)
    .put(protect, allowedWith(permissions.PRODUCTUPDATE), ProductController.updateById)
    .delete(protect, allowedWith(permissions.PRODUCTDELETE), ProductController.deleteById);

export default router;

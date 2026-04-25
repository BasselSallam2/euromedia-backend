import { Router } from "express";
import { protect } from "@/middlewares/protect";
import UploadController from "./upload.controller";
import multer from "multer";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

// Single image upload route
router.post("/", protect, upload.single("image"), UploadController.uploadImage);


export default router;

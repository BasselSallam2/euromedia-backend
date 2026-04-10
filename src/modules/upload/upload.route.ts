import { Router } from "express";
import { protect } from "@/middlewares/protect";
import UploadController from "./upload.controller";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, "image-" + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

// Single image upload route
router.post("/", protect, upload.single("image"), UploadController.uploadImage);

export default router;

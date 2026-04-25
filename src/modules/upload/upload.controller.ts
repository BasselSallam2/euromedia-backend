import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { uploadToCloudinary } from "./cloudinary.service";

class UploadController {
    uploadImage = asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).json({
                success: false,
                status: "fail",
                message: "No image file provided"
            });
            return;
        }

        const url = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

        res.status(200).json({
            success: true,
            status: "success",
            data: { url }
        });
    });
}

export default new UploadController();

import type { Request, Response } from "express";

class UploadController {
    uploadImage(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                status: "fail",
                message: "No image file provided"
            });
        }

        // Return the local URL for development
        // This is where Cloudinary integration will be handled in production
        const protocol = req.protocol;
        const host = req.get("host");
        const url = `${protocol}://${host}/public/uploads/${req.file.filename}`;

        return res.status(200).json({
            success: true,
            status: "success",
            data: {
                url
            }
        });
    }
}

export default new UploadController();

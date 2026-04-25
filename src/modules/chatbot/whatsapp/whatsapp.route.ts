import { Router } from "express";
import whatsappService from "./whatsapp.service";

const router = Router();

/**
 * @swagger
 * /chatbot/whatsapp/status:
 *   get:
 *     summary: Get WhatsApp connection status
 *     tags: [Chatbot]
 *     responses:
 *       200:
 *         description: WhatsApp status
 */
router.get("/status", (req, res) => {
    res.status(200).json({
        status: "success",
        data: {
            isReady: whatsappService.isWhatsAppReady
        }
    });
});

export default router;

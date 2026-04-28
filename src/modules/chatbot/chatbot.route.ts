import ChatbotController from "@modules/chatbot/chatbot.controller";
import whatsappRouter from "@modules/chatbot/whatsapp/whatsapp.route";
import { Router } from "express";
import rateLimit from "express-rate-limit";

// Tight per-IP limiter for the chatbot endpoint only.
// 6000 TPM Groq free tier ≈ 3-5 requests/min; allow 15 to be generous but stop spammers.
const chatbotLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1-minute window
    max: 15,                     // 15 requests per IP per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "fail",
        message: "Too many requests. Please wait a moment before asking again.",
    },
    skipSuccessfulRequests: false,
});

const router = Router();

// Public endpoint for chatbot
router.post("/ask", chatbotLimiter, ChatbotController.chat);

// WhatsApp specific routes
router.use("/whatsapp", whatsappRouter);

// Protected CRUD endpoints (admin only or internal)
// router.route("/")
// .post(protect, allowedWith(permissions.CHATBOTCREATE), ChatbotController.createOne)
// .get(protect, allowedWith(permissions.CHATBOTREAD), ChatbotController.getAll);

export default router;
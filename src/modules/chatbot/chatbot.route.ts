import ChatbotController from "@modules/chatbot/chatbot.controller";
import whatsappRouter from "@modules/chatbot/whatsapp/whatsapp.route";
import { Router } from "express";

const router = Router();

// Public endpoint for chatbot
router.post("/ask", ChatbotController.chat);

// WhatsApp specific routes
router.use("/whatsapp", whatsappRouter);

// Protected CRUD endpoints (admin only or internal)
// router.route("/")
// .post(protect, allowedWith(permissions.CHATBOTCREATE), ChatbotController.createOne)
// .get(protect, allowedWith(permissions.CHATBOTREAD), ChatbotController.getAll);

export default router;
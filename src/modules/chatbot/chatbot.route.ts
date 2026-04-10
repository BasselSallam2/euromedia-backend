import ChatbotController from "@modules/chatbot/chatbot.controller";
import { Router } from "express";

const router = Router();

// Public endpoint for chatbot
router.post("/ask", ChatbotController.chat);

// Protected CRUD endpoints (admin only or internal)
// router.route("/")
// .post(protect, allowedWith(permissions.CHATBOTCREATE), ChatbotController.createOne)
// .get(protect, allowedWith(permissions.CHATBOTREAD), ChatbotController.getAll);

export default router;
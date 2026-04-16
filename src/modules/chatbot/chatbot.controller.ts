import chatbotService from "@modules/chatbot/chatbot.services";
import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";

export class ChatbotController {
    /**
     * Handles chatbot interactions.
     * Entirely stateless: receives full history from frontend, 
     * returns AI response. No database lookup.
     */
    chat = asyncHandler(async (req: Request, res: Response) => {
        const { message, history } = req.body;

        if (!message) {
            res.status(400).json({
                status: "fail",
                message: "Message is required"
            });
            return;
        }

        // Clean up: history can be undefined/null for first message
        const conversationHistory = Array.isArray(history) ? history : [];

        const response = await chatbotService.getGroqResponse(conversationHistory, message);

        res.status(200).json({
            status: "success",
            data: response
        });
    });
}

export default new ChatbotController();
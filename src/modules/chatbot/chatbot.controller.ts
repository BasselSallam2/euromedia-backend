import chatbotService from "@modules/chatbot/chatbot.services";
import { GenericController } from "@shared/genericController";
import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";

export class ChatbotController extends GenericController<typeof chatbotService> {
    constructor() {
        super(chatbotService);
    }

    chat = asyncHandler(async (req: Request, res: Response) => {
        const { message, userId } = req.body;

        if (!message) {
            res.status(400).json({
                status: "fail",
                message: "Message is required"
            });
            return;
        }

        const response = await chatbotService.getGroqResponse(userId || "anonymous", message);

        res.status(200).json({
            status: "success",
            data: response
        });
    });
}

export default new ChatbotController();
import contactService from "@modules/contact/contact.services";
import { GenericController } from "@shared/genericController";
import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { ApiError } from "@/utils/apiError";

export class ContactController extends GenericController<typeof contactService> {
    constructor() {
        super(contactService);
    }

    /**
     * Handles contact form submissions.
     * Verifies reCAPTCHA and sends an email inquiry.
     */
    send = asyncHandler(async (req: Request, res: Response) => {
        const { name, email, inquiry, recaptchaToken } = req.body;

        if (!name || !email || !inquiry) {
            throw new ApiError(400, "errors.all_fields_required");
        }

        // Verify reCAPTCHA token
        if (!recaptchaToken) {
            throw new ApiError(400, "errors.recaptcha_missing");
        }

        const isHuman = await contactService.verifyRecaptcha(recaptchaToken);
        if (!isHuman) {
            throw new ApiError(403, "errors.spam_detected");
        }

        // Send Thank You email to User
        await contactService.sendThankYouEmail({ name, email });

        // Send Notification to CRM/Company
        await contactService.sendInquiryNotification({ name, email, inquiry });

        // CRM: Save to Database
        try {
            await contactService.createOne({ name, email, inquiry, status: "pending" });
        } catch (dbError) {
            console.error("[ContactController] Failed to save inquiry to DB:", dbError);
        }

        res.status(200).json({
            status: "success",
            message: "Inquiry sent successfully. Thank you email delivered to user."
        });
    });
}

export default new ContactController();
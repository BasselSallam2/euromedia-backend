import { ContactModel } from "@/modules/contact/contact.schema";
import { GenericServices } from "@/services/genericServices";
import type { IContact } from "@modules/contact/contact.interface";
import { Model } from "mongoose";
import nodemailer from "nodemailer";
import { ApiError } from "@/utils/apiError";

export class ContactService extends GenericServices<IContact> {
    constructor(model: Model<IContact>) {
        super(model);
    }

    /**
     * Verifies reCAPTCHA v3 token using Google's API.
     * Score >= 0.5 is considered human.
     */
    async verifyRecaptcha(token: string): Promise<boolean> {
        const secret = process.env.RECAPTCHA_SECRET_KEY;
        if (!secret) {
            console.warn("[ContactService] RECAPTCHA_SECRET_KEY is not defined. Skipping verification in dev mode.");
            return true;
        }

        try {
            const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `secret=${secret}&response=${token}`,
            });
            const data = (await response.json()) as any;
            return data.success === true && (data.score ?? 1.0) >= 0.5;
        } catch (error) {
            console.error("[ContactService] reCAPTCHA verification failed:", error);
            return false;
        }
    }

    /**
     * Sends a "Thank You" email to the user who filled the form.
     */
    async sendThankYouEmail(data: { name: string; email: string }) {
        const { name, email } = data;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #c0392b; margin-bottom: 24px;">Thank You for Contacting Us, ${name}!</h2>
          <p style="color: #333; line-height: 1.6;">
            We have received your inquiry and our team will get back to you as soon as possible.
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 14px; color: #777;">
            Best regards,<br />
            <strong>PetroGuide Team</strong>
          </p>
          <p style="margin-top: 24px; font-size: 12px; color: #999;">
            This is an automated response to your contact form submission on petroguide-eg.com.
          </p>
        </div>
      `;

        try {
            await transporter.sendMail({
                from: `"PetroGuide" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `Thank you for your inquiry, ${name}`,
                html: htmlContent,
            });
        } catch (error) {
            console.error("[ContactService] Nodemailer error (Thank You Email):", error);
            throw new ApiError(500, "errors.email_failed");
        }
    }

    /**
     * Sends an inquiry notification email to the company (CRM).
     */
    async sendInquiryNotification(data: { name: string; email: string; inquiry: string }) {
        const { name, email, inquiry } = data;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #c0392b; margin-bottom: 24px;">New CRM Lead — PetroGuide</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 16px; background: #fff; border: 1px solid #e0e0e0; font-weight: bold; width: 120px; color: #555;">Name</td>
              <td style="padding: 12px 16px; background: #fff; border: 1px solid #e0e0e0; color: #222;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; background: #fafafa; border: 1px solid #e0e0e0; font-weight: bold; color: #555;">Email</td>
              <td style="padding: 12px 16px; background: #fafafa; border: 1px solid #e0e0e0; color: #222;">
                <a href="mailto:${email}" style="color: #c0392b;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; background: #fff; border: 1px solid #e0e0e0; font-weight: bold; color: #555; vertical-align: top;">Inquiry</td>
              <td style="padding: 12px 16px; background: #fff; border: 1px solid #e0e0e0; color: #222; white-space: pre-line;">${inquiry}</td>
            </tr>
          </table>
        </div>
      `;

        try {
            await transporter.sendMail({
                from: `"CRM Lead" <${process.env.EMAIL_USER}>`,
                to: process.env.CONTACT_EMAIL,
                replyTo: email,
                subject: `New Lead from ${name}`,
                html: htmlContent,
            });
        } catch (error) {
            console.error("[ContactService] Nodemailer error (CRM Notification):", error);
            // Non-critical: we don't throw to avoid blocking the user flow if notification fails
        }
    }
}

export default new ContactService(ContactModel);
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
   * Fetches company info for email branding.
   */
  async getCompanyInfo() {
    try {
      const { CompanyModel } = await import("../company/company.schema");
      return await CompanyModel.findOne({ isOwner: true }).lean();
    } catch {
      return null;
    }
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
   * Generates a branded HTML layout for emails.
   */
  private getEmailLayout(content: string, companyInfo: any) {
    const logoUrl = companyInfo?.logo || "https://res.cloudinary.com/demo/image/upload/v1622550000/sample.jpg"; // Placeholder if none
    const companyName = companyInfo?.name || "Euro Media";
    const primaryColor = "#00AEDA"; // Cyan from website
    const secondaryColor = "#006E8B"; // Darker Cyan

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f9; }
            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #f0f0f0; }
            .logo { max-height: 50px; width: auto; }
            .content { padding: 40px; }
            .footer { background: #1a1f2e; color: #ffffff; padding: 40px 20px; text-align: center; font-size: 13px; }
            .footer-links { margin-bottom: 20px; }
            .footer-links a { color: #8a99af; text-decoration: none; margin: 0 10px; }
            .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
            .highlight { color: ${primaryColor}; font-weight: bold; }
            .divider { border: 0; border-top: 1px solid #eee; margin: 30px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="${companyName}" class="logo" />
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <div class="footer-links">
                <a href="https://euromediaprint.com">Website</a>
                <a href="https://euromediaprint.com/about">About Us</a>
                <a href="https://euromediaprint.com/contact">Contact</a>
              </div>
              <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              <p>Premium Printing Solutions & Consultancy</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Sends a "Thank You" email to the user who filled the form.
   */
  async sendThankYouEmail(data: { name: string; email: string }) {
    const { name, email } = data;
    const companyInfo = await this.getCompanyInfo();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const content = `
      <h2 style="margin-top: 0;">Hello ${name},</h2>
      <p>Thank you for reaching out to <span class="highlight">Euro Media</span>. We've successfully received your inquiry and our technology specialists are already reviewing your requirements.</p>
      <p>We pride ourselves on providing high-end printing solutions tailored to your specific business needs. One of our consultants will contact you shortly to discuss how we can help you achieve excellence in your printing operations.</p>
      <div style="text-align: center;">
        <a href="https://euromediaprint.com/products" class="btn">Explore Our Machinery</a>
      </div>
      <div class="divider"></div>
      <p style="font-size: 14px; color: #666;">In the meantime, feel free to browse our latest collection of premium industrial printers and solutions.</p>
    `;

    const html = this.getEmailLayout(content, companyInfo);

    try {
      await transporter.sendMail({
        from: `"Euro Media" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `We've received your inquiry – Euro Media`,
        html: html,
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
    const companyInfo = await this.getCompanyInfo();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const content = `
      <h2 style="margin-top: 0; color: #1a1f2e;">New CRM Lead Summary</h2>
      <p>A new inquiry has been captured via the website. Below are the details for follow-up.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
        <tr>
          <td style="padding: 15px; background: #f8f9fa; border: 1px solid #eee; font-weight: bold; width: 30%;">Full Name</td>
          <td style="padding: 15px; border: 1px solid #eee;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 15px; background: #f8f9fa; border: 1px solid #eee; font-weight: bold;">Email Address</td>
          <td style="padding: 15px; border: 1px solid #eee;"><a href="mailto:${email}" style="color: #00AEDA;">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 15px; background: #f8f9fa; border: 1px solid #eee; font-weight: bold; vertical-align: top;">Message</td>
          <td style="padding: 15px; border: 1px solid #eee; white-space: pre-line;">${inquiry}</td>
        </tr>
      </table>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://euromediaprint.com/admin/customers" class="btn">View in Admin Dashboard</a>
      </div>
    `;

    const html = this.getEmailLayout(content, companyInfo);

    try {
      await transporter.sendMail({
        from: `"Euro Media CRM" <${process.env.EMAIL_USER}>`,
        to: process.env.CONTACT_EMAIL,
        replyTo: email,
        subject: `New Lead: ${name} [CRM Notification]`,
        html: html,
      });
    } catch (error) {
      console.error("[ContactService] Nodemailer error (CRM Notification):", error);
    }
  }
}

export default new ContactService(ContactModel);
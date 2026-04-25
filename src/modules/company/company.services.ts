import { CompanyModel } from "./company.schema";
import { GenericServices } from "@/services/genericServices";
import type { ICompany } from "./company.interface";
import { CustomerModel } from "../customer/customer.schema";
import ContactService from "../contact/contact.services";
import { Model } from "mongoose";

export class CompanyService extends GenericServices<ICompany> {
    constructor(model: Model<ICompany>) {
        super(model);
    }

    async captureLead(data: {
        personName: string;
        email: string;
        phoneNumber: string;
        companyName?: string;
        website?: string;
        metadata?: any;
    }) {
        let companyId = null;

        if (data.companyName || data.website) {
            const query: any = {};
            if (data.companyName) query.name = data.companyName;
            if (data.website) query.website = data.website;

            let company = await this.model.findOne({
                $or: [
                    data.companyName ? { name: data.companyName } : null,
                    data.website ? { website: data.website } : null
                ].filter(Boolean) as any[]
            });

            if (company) {
                // Update metadata if company exists
                company.metadata = { ...company.metadata, ...data.metadata };
                await company.save();
                companyId = company._id;
            } else {
                // Create new company
                const newCompany = await this.model.create({
                    name: data.companyName || "Unknown",
                    website: data.website,
                    metadata: data.metadata,
                });
                companyId = newCompany._id;
            }
        }

        // Create Customer
        const customer = await CustomerModel.create({
            name: data.personName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            companyId: companyId || undefined,
        });

        // Send Thank You Email (non-blocking)
        ContactService.sendThankYouEmail({
            name: data.personName,
            email: data.email,
        }).catch((err) => console.error("[CompanyService] Failed to send thank you email:", err));

        return { customer, companyId };
    }
}

export default new CompanyService(CompanyModel);

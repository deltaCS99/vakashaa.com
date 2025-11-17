// actions/operator/service-agreement.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { generateSignedAgreementPDF } from "@/lib/pdf-generator";

interface SignAgreementParams {
    profileId: string;
    businessName: string;
    registrationNumber: string;
    physicalAddress: string;
    phone: string;
    email: string;
    fullName: string;
    capacity: string;
    isSoleProprietor: boolean;
}

export const signServiceAgreement = async (params: SignAgreementParams) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Operator") {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        const profile = await db.operatorProfile.findUnique({
            where: { id: params.profileId, userId: user.id },
        });

        if (!profile) {
            return response({
                success: false,
                error: { code: 404, message: "Profile not found" },
            });
        }

        if (profile.isApproved) {
            return response({
                success: false,
                error: { code: 400, message: "Agreement already signed and locked" },
            });
        }

        // Generate PDF with signed agreement
        const pdfResult = await generateSignedAgreementPDF({
            businessName: params.businessName,
            registrationNumber: params.registrationNumber,
            physicalAddress: params.physicalAddress,
            phone: params.phone,
            email: params.email,
            fullName: params.fullName,
            capacity: params.capacity,
            isSoleProprietor: params.isSoleProprietor,
            signedAt: new Date(),
            profileId: params.profileId,
        });

        if (!pdfResult.success || !pdfResult.url) {
            return response({
                success: false,
                error: { code: 500, message: "Failed to generate agreement PDF" },
            });
        }

        // Update operator profile
        const updated = await db.operatorProfile.update({
            where: { id: params.profileId },
            data: {
                businessName: params.businessName,
                businessPhone: params.phone,
                companyRegistrationNumber: params.registrationNumber,
                physicalAddress: params.physicalAddress,
                capacity: params.capacity,
                serviceAgreement: pdfResult.url,
                serviceAgreementSignedAt: new Date(),
                updatedAt: new Date(),
            },
        });

        // Update user name if changed
        if (params.fullName !== user.name) {
            await db.user.update({
                where: { id: user.id },
                data: { name: params.fullName },
            });
        }

        revalidatePath("/operator/settings");

        return response({
            success: true,
            code: 200,
            data: { profile: updated },
        });
    } catch (error: any) {
        console.error("Error signing service agreement:", error);
        return response({
            success: false,
            error: { code: 500, message: "Failed to sign agreement" },
        });
    }
};
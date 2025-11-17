// actions/operator/verification.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { uploadVerificationDocument } from "@/lib/upload";

// Upload individual verification document
export const uploadVerificationDoc = async (formData: FormData) => {
    try {
        const user = await currentUser();
        if (!user || user.role !== "Operator") {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        const profileId = formData.get("profileId") as string;
        const documentType = formData.get("documentType") as "cipc" | "id" | "agreement";
        const file = formData.get("file") as File;

        if (!file) {
            return response({
                success: false,
                error: { code: 400, message: "No file provided" },
            });
        }

        const profile = await db.operatorProfile.findUnique({
            where: { id: profileId, userId: user.id },
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
                error: { code: 403, message: "Documents locked after approval" },
            });
        }

        // Convert File to FileData
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64,
        };

        // Upload to Supabase
        const uploadResult = await uploadVerificationDocument(fileData, profileId, documentType);

        if (!uploadResult.success) {
            return response({
                success: false,
                error: { code: 400, message: uploadResult.error || "Upload failed" },
            });
        }

        // Update database with URL
        const updateData: any = { updatedAt: new Date() };

        if (documentType === "cipc") {
            updateData.companyRegistrationDocument = uploadResult.url;
        } else if (documentType === "id") {
            updateData.idDocument = uploadResult.url;
            updateData.idDocumentType = formData.get("idDocumentType") as "ID" | "Passport";
        } else if (documentType === "agreement") {
            updateData.serviceAgreement = uploadResult.url;
            updateData.serviceAgreementSignedAt = new Date();
        }

        const updated = await db.operatorProfile.update({
            where: { id: profileId },
            data: updateData,
        });

        revalidatePath("/operator/settings");

        return response({
            success: true,
            code: 200,
            data: { profile: updated },
        });
    } catch (error: any) {
        console.error("Error uploading document:", error);
        return response({
            success: false,
            error: { code: 500, message: "Failed to upload" },
        });
    }
};

// Submit everything for initial verification
export const submitForVerification = async (profileId: string) => {
    try {
        const user = await currentUser();
        if (!user || user.role !== "Operator") {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        const profile = await db.operatorProfile.findUnique({
            where: { id: profileId, userId: user.id },
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
                error: { code: 400, message: "Already verified" },
            });
        }

        // Validate all required fields
        if (
            !profile.companyRegistrationDocument ||
            !profile.idDocument ||
            !profile.serviceAgreement ||
            !profile.bankCode ||
            !profile.accountNumber ||
            !profile.accountName ||
            !profile.bankVerificationDocument
        ) {
            return response({
                success: false,
                error: { code: 400, message: "Please complete all verification steps" },
            });
        }

        // Mark as submitted for verification
        const updated = await db.operatorProfile.update({
            where: { id: profileId },
            data: {
                verificationDocumentsSubmittedAt: new Date(),
                bankVerificationStatus: "Pending",
                bankVerificationSubmittedAt: new Date(),
                updatedAt: new Date(),
            },
        });

        // TODO: Send notification to admin
        console.log(`🔔 New verification request from ${profile.businessName}`);

        revalidatePath("/operator/settings");
        revalidatePath("/operator/dashboard");

        return response({
            success: true,
            code: 200,
            data: { profile: updated },
        });
    } catch (error: any) {
        console.error("Error submitting verification:", error);
        return response({
            success: false,
            error: { code: 500, message: "Failed to submit" },
        });
    }
};

// Submit bank details for re-verification (after approval)
export const submitBankReverification = async (profileId: string) => {
    try {
        const user = await currentUser();
        if (!user || user.role !== "Operator") {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        const profile = await db.operatorProfile.findUnique({
            where: { id: profileId, userId: user.id },
        });

        if (!profile || !profile.isApproved) {
            return response({
                success: false,
                error: { code: 400, message: "Profile must be verified first" },
            });
        }

        // Validate bank fields
        if (
            !profile.bankCode ||
            !profile.accountNumber ||
            !profile.accountName ||
            !profile.bankVerificationDocument
        ) {
            return response({
                success: false,
                error: { code: 400, message: "Please complete all bank details" },
            });
        }

        // Mark bank for re-verification
        const updated = await db.operatorProfile.update({
            where: { id: profileId },
            data: {
                bankVerificationStatus: "Pending",
                bankVerificationSubmittedAt: new Date(),
                bankVerificationNotes: null, // Clear any previous rejection notes
                updatedAt: new Date(),
            },
        });

        // TODO: Send notification to admin
        console.log(`🔔 Bank re-verification request from ${profile.businessName}`);

        revalidatePath("/operator/settings");
        revalidatePath("/operator/dashboard");

        return response({
            success: true,
            code: 200,
            data: { profile: updated },
        });
    } catch (error: any) {
        console.error("Error submitting bank re-verification:", error);
        return response({
            success: false,
            error: { code: 500, message: "Failed to submit" },
        });
    }
};
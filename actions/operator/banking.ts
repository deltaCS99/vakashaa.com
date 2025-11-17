// actions/operator/banking.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { uploadBankDocument } from "@/lib/upload";

interface SaveBankDetailsParams {
    profileId: string;
    bankName?: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
}

export const saveBankDetails = async (params: SaveBankDetailsParams) => {
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

        // Check if bank details changed (for re-verification)
        const bankChanged =
            profile.bankCode !== params.bankCode ||
            profile.accountNumber !== params.accountNumber ||
            profile.accountName !== params.accountName;

        // Update bank details
        const updated = await db.operatorProfile.update({
            where: { id: params.profileId },
            data: {
                bankName: params.bankName,
                bankCode: params.bankCode,
                accountNumber: params.accountNumber,
                accountName: params.accountName,
                // Don't change verification status yet - only when they submit for review
                updatedAt: new Date(),
            },
        });

        revalidatePath("/operator/settings");

        return response({
            success: true,
            code: 200,
            data: {
                profile: updated,
                bankChanged, // Return if changed (for UI warnings)
            },
        });
    } catch (error: any) {
        console.error("Error saving bank details:", error);
        return response({
            success: false,
            error: { code: 500, message: "Failed to save bank details" },
        });
    }
};

export const uploadBankDoc = async (formData: FormData) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Operator") {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        const profileId = formData.get("profileId") as string;
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
        const uploadResult = await uploadBankDocument(fileData, profileId);

        if (!uploadResult.success) {
            return response({
                success: false,
                error: { code: 400, message: uploadResult.error || "Upload failed" },
            });
        }

        // Update database with URL
        const updated = await db.operatorProfile.update({
            where: { id: profileId },
            data: {
                bankVerificationDocument: uploadResult.url,
                updatedAt: new Date(),
            },
        });

        revalidatePath("/operator/settings");

        return response({
            success: true,
            code: 200,
            data: { profile: updated },
        });
    } catch (error: any) {
        console.error("Error uploading bank document:", error);
        return response({
            success: false,
            error: { code: 500, message: "Failed to upload document" },
        });
    }
};
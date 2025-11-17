// actions/operator/settings.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { OperatorType, ServiceType } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface UpdateProfileParams {
    profileId: string;
    businessName: string;
    businessPhone: string;
    businessWhatsApp: string;
    description?: string;
    operatorType: OperatorType;
    serviceType: ServiceType;
}

export const updateOperatorProfile = async (params: UpdateProfileParams) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Operator") {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        // Verify profile belongs to user
        const profile = await db.operatorProfile.findUnique({
            where: { id: params.profileId, userId: user.id },
        });

        if (!profile) {
            return response({
                success: false,
                error: { code: 404, message: "Profile not found" },
            });
        }

        // Update profile (always allowed)
        const updated = await db.operatorProfile.update({
            where: { id: params.profileId },
            data: {
                businessName: params.businessName,
                businessPhone: params.businessPhone,
                businessWhatsApp: params.businessWhatsApp,
                description: params.description,
                operatorType: params.operatorType,
                serviceType: params.serviceType,
                updatedAt: new Date(),
            },
        });

        revalidatePath("/operator/settings");
        revalidatePath("/operator/dashboard");

        return response({
            success: true,
            code: 200,
            data: { profile: updated },
        });
    } catch (error: any) {
        console.error("Error updating profile:", error);
        return response({
            success: false,
            error: { code: 500, message: "Failed to update profile" },
        });
    }
};
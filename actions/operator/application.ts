// actions/operator/application.ts
"use server";

import { db } from "@/lib/db";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { OperatorType, ServiceType } from "@prisma/client";

interface SubmitApplicationParams {
    userId: string;
    businessName: string;
    businessPhone: string;
    businessWhatsApp: string;
    description?: string;
    operatorType: OperatorType;
    serviceType: ServiceType;
}

export const submitOperatorApplication = async (params: SubmitApplicationParams) => {
    try {
        // Validate required fields
        if (!params.userId || !params.businessName || !params.businessPhone) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "User ID, business name, and phone are required.",
                },
            });
        }

        // Check if user exists
        const user = await db.user.findUnique({
            where: { id: params.userId },
        });

        if (!user) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "User not found.",
                },
            });
        }

        // Create operator profile
        const operatorProfile = await db.operatorProfile.create({
            data: {
                userId: params.userId,
                businessName: params.businessName,
                businessPhone: params.businessPhone,
                businessWhatsApp: params.businessWhatsApp,
                description: params.description,
                operatorType: params.operatorType,
                serviceType: params.serviceType,
                isApproved: false, // Draft mode
            },
        });

        // Update user role to Operator (only if not already)
        if (user.role !== "Operator") {
            await db.user.update({
                where: { id: params.userId },
                data: { role: "Operator" },
            });
        }

        revalidatePath("/operator/apply");
        revalidatePath("/operator/dashboard");

        return response({
            success: true,
            code: 201,
            data: { operatorProfile },
        });
    } catch (error: any) {
        console.error("Error creating operator profile:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to create profile. Please try again.",
            },
        });
    }
};
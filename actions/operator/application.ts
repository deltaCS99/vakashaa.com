// actions/operator/application.ts
"use server";

import { db } from "@/lib/db";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { OperatorType, ServiceType } from "@prisma/client";

interface SubmitApplicationParams {
    userId: string;
    businessName: string;
    businessPhone?: string;
    businessWhatsApp?: string;
    description?: string;
    operatorType: OperatorType;
    serviceType: ServiceType;
}

export const submitOperatorApplication = async (params: SubmitApplicationParams) => {
    try {
        // Validate required fields
        if (!params.userId || !params.businessName) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "User ID and business name are required.",
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

        // Check if operator profile already exists
        const existingProfile = await db.operatorProfile.findUnique({
            where: { userId: params.userId },
        });

        if (existingProfile) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "You have already submitted an operator application.",
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
                isApproved: false, // Requires admin approval
            },
        });

        // Update user role to Operator
        await db.user.update({
            where: { id: params.userId },
            data: { role: "Operator" },
        });

        // TODO: Send notification email to admin about new application
        // TODO: Send confirmation email to applicant

        revalidatePath("/operator/apply");
        revalidatePath("/operator/dashboard");

        return response({
            success: true,
            code: 201,
            data: { operatorProfile },
        });
    } catch (error: any) {
        console.error("Error submitting operator application:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to submit application. Please try again.",
            },
        });
    }
};
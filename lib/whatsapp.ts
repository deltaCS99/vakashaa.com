// lib/whatsapp.ts
"use server";

import { Twilio } from "twilio";

// Initialize Twilio client
const twilioClient = new Twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER!;

/**
 * Format phone number for WhatsApp
 * Ensures number is in E.164 format (e.g., +27821234567)
 */
export const formatWhatsAppNumber = (phoneNumber: string): string => {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, "");

    // If number starts with 0, replace with country code (assume SA +27)
    if (cleaned.startsWith("0")) {
        cleaned = "27" + cleaned.substring(1);
    }

    // If doesn't start with +, add it
    if (!cleaned.startsWith("+")) {
        cleaned = "+" + cleaned;
    }

    return `whatsapp:${cleaned}`;
}


/**
 * Send WhatsApp message via Twilio
 */
export const sendWhatsAppMessage = async (params: {
    to: string; // Phone number
    message: string;
    mediaUrl?: string; // Optional image/document URL
}): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    try {
        // Validate environment variables
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            throw new Error("Twilio credentials not configured");
        }

        if (!TWILIO_WHATSAPP_NUMBER) {
            throw new Error("Twilio WhatsApp number not configured");
        }

        // Format phone number
        const formattedNumber = formatWhatsAppNumber(params.to);

        // Send message
        const message = await twilioClient.messages.create({
            body: params.message,
            from: TWILIO_WHATSAPP_NUMBER,
            to: formattedNumber,
            ...(params.mediaUrl && { mediaUrl: [params.mediaUrl] }),
        });

        console.log("WhatsApp message sent:", {
            messageId: message.sid,
            to: formattedNumber,
            status: message.status,
        });

        return {
            success: true,
            messageId: message.sid,
        };
    } catch (error: any) {
        console.error("Failed to send WhatsApp message:", error);
        return {
            success: false,
            error: error.message || "Failed to send WhatsApp message",
        };
    }
}

/**
 * Send WhatsApp notification to operator
 */
export const sendOperatorWhatsAppNotification = async (params: {
    operatorId: string;
    message: string;
    type: "quality_control" | "rejection" | "bank_rejection" | "approval" | "general";
}) => {
    const { db } = await import("@/lib/db");

    try {
        // Get operator details
        const operator = await db.operatorProfile.findUnique({
            where: { id: params.operatorId },
            select: {
                businessName: true,
                businessWhatsApp: true,
            },
        });

        if (!operator) {
            return {
                success: false,
                error: "Operator not found",
            };
        }

        if (!operator.businessWhatsApp) {
            return {
                success: false,
                error: "Operator has no WhatsApp number on file",
            };
        }

        // Send message
        return await sendWhatsAppMessage({
            to: operator.businessWhatsApp,
            message: params.message,
        });
    } catch (error: any) {
        console.error("Failed to send operator WhatsApp notification:", error);
        return {
            success: false,
            error: error.message || "Failed to send notification",
        };
    }
}

/**
 * Send WhatsApp notification to user/customer
 */
export const sendUserWhatsAppNotification = async (params: {
    userId: string;
    message: string;
    type: "quote_update" | "booking_confirmation" | "payment_reminder" | "general";
}) => {
    const { db } = await import("@/lib/db");

    try {
        // Get user details
        const user = await db.user.findUnique({
            where: { id: params.userId },
            select: {
                name: true,
                whatsappNumber: true,
                phone: true, // Fallback to phone if no WhatsApp
            },
        });

        if (!user) {
            return {
                success: false,
                error: "User not found",
            };
        }

        const phoneNumber = user.whatsappNumber || user.phone;

        if (!phoneNumber) {
            return {
                success: false,
                error: "User has no WhatsApp/phone number on file",
            };
        }

        // Send message
        return await sendWhatsAppMessage({
            to: phoneNumber,
            message: params.message,
        });
    } catch (error: any) {
        console.error("Failed to send user WhatsApp notification:", error);
        return {
            success: false,
            error: error.message || "Failed to send notification",
        };
    }
}


/**
 * Send templated WhatsApp notification
 */
export async function sendTemplatedWhatsAppNotification(params: {
    to: string;
    template: string;
    variables?: Record<string, string>;
}) {
    let message = params.template;

    // Replace variables in template
    if (params.variables) {
        Object.entries(params.variables).forEach(([key, value]) => {
            message = message.replace(new RegExp(`{${key}}`, "g"), value);
        });
    }

    return await sendWhatsAppMessage({
        to: params.to,
        message,
    });
}
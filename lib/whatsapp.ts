// lib/whatsapp.ts
"use server";

import { Twilio } from "twilio";
import { db } from "@/lib/db";
import { formatPrice } from "./utils";

// Validate environment variables
if (!process.env.TWILIO_ACCOUNT_SID) {
    console.warn("⚠️ TWILIO_ACCOUNT_SID not configured");
}
if (!process.env.TWILIO_AUTH_TOKEN) {
    console.warn("⚠️ TWILIO_AUTH_TOKEN not configured");
}
if (!process.env.TWILIO_WHATSAPP_NUMBER) {
    console.warn("⚠️ TWILIO_WHATSAPP_NUMBER not configured");
}

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// Template Content SIDs (from Twilio Console)
const TEMPLATES = {
    // Operator notifications
    OPERATOR_APPLICATION_APPROVED: process.env.WHATSAPP_OPERATOR_APPROVED_TEMPLATE,
    OPERATOR_APPLICATION_REJECTED: process.env.WHATSAPP_OPERATOR_REJECTED_TEMPLATE,
    OPERATOR_BANK_REJECTED: process.env.WHATSAPP_OPERATOR_BANK_REJECTED_TEMPLATE,
    OPERATOR_NEW_QUOTE: process.env.WHATSAPP_OPERATOR_NEW_QUOTE_TEMPLATE,
    OPERATOR_QUALITY_CONTROL: process.env.WHATSAPP_OPERATOR_QUALITY_TEMPLATE,
    OPERATOR_NEW_MESSAGE: process.env.WHATSAPP_OPERATOR_NEW_MESSAGE_TEMPLATE,

    // Customer notifications
    CUSTOMER_QUOTE_RESPONSE: process.env.WHATSAPP_CUSTOMER_QUOTE_RESPONSE_TEMPLATE,
    CUSTOMER_PAYMENT_SUCCESS: process.env.WHATSAPP_CUSTOMER_PAYMENT_SUCCESS_TEMPLATE,
    CUSTOMER_BOOKING_CONFIRMATION: process.env.WHATSAPP_CUSTOMER_BOOKING_CONFIRMATION_TEMPLATE,
    CUSTOMER_QUOTE_EXPIRING: process.env.WHATSAPP_CUSTOMER_QUOTE_EXPIRING_TEMPLATE,
    CUSTOMER_TOUR_COMPLETED: process.env.WHATSAPP_CUSTOMER_TOUR_COMPLETED_TEMPLATE,
    CUSTOMER_NEW_MESSAGE: process.env.WHATSAPP_CUSTOMER_NEW_MESSAGE_TEMPLATE,
};

// Check if WhatsApp is configured
function isWhatsAppConfigured(): boolean {
    return !!(ACCOUNT_SID && AUTH_TOKEN && FROM_NUMBER);
}

// Get Twilio client
function getTwilioClient(): Twilio | null {
    if (!isWhatsAppConfigured()) {
        return null;
    }
    return new Twilio(ACCOUNT_SID!, AUTH_TOKEN!);
}

// Format phone number for WhatsApp
function formatWhatsAppNumber(phone: string): string {
    // Remove any spaces, dashes, or special characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    // Ensure it starts with + for country code
    const withPlus = cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
    // Add whatsapp: prefix if not present
    return withPlus.startsWith("whatsapp:") ? withPlus : `whatsapp:${withPlus}`;
}

/**
 * Send operator application approved notification
 * Template variables: {{1}} = Business Name
 */
export async function sendOperatorApprovedNotification(params: {
    operatorId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!isWhatsAppConfigured()) {
            console.warn("WhatsApp not configured - skipping notification");
            return { success: false, error: "WhatsApp service not configured" };
        }

        const templateSid = TEMPLATES.OPERATOR_APPLICATION_APPROVED;
        if (!templateSid) {
            console.warn("OPERATOR_APPLICATION_APPROVED template not configured");
            return { success: false, error: "Template not configured" };
        }

        const operator = await db.operatorProfile.findUnique({
            where: { id: params.operatorId },
            select: { businessName: true, businessWhatsApp: true },
        });

        if (!operator?.businessWhatsApp) {
            return { success: false, error: "Operator WhatsApp not available" };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, error: "Failed to initialize client" };
        }

        const message = await client.messages.create({
            from: formatWhatsAppNumber(FROM_NUMBER!),
            to: formatWhatsAppNumber(operator.businessWhatsApp),
            contentSid: templateSid,
            contentVariables: JSON.stringify({
                "1": operator.businessName,
            }),
        });

        console.log(`✅ Approval notification sent to ${operator.businessName}: ${message.sid}`);
        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error("❌ WhatsApp approval notification error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Send operator application rejected notification
 * Template variables: {{1}} = Business Name, {{2}} = Rejection Reason
 */
export async function sendOperatorRejectedNotification(params: {
    operatorId: string;
    reason: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!isWhatsAppConfigured()) {
            return { success: false, error: "WhatsApp not configured" };
        }

        const templateSid = TEMPLATES.OPERATOR_APPLICATION_REJECTED;
        if (!templateSid) {
            console.warn("OPERATOR_APPLICATION_REJECTED template not configured");
            return { success: false, error: "Template not configured" };
        }

        const operator = await db.operatorProfile.findUnique({
            where: { id: params.operatorId },
            select: { businessName: true, businessWhatsApp: true },
        });

        if (!operator?.businessWhatsApp) {
            return { success: false, error: "Operator WhatsApp not available" };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, error: "Failed to initialize client" };
        }

        const message = await client.messages.create({
            from: formatWhatsAppNumber(FROM_NUMBER!),
            to: formatWhatsAppNumber(operator.businessWhatsApp),
            contentSid: templateSid,
            contentVariables: JSON.stringify({
                "1": operator.businessName,
                "2": params.reason,
            }),
        });

        console.log(`✅ Rejection notification sent to ${operator.businessName}`);
        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error("❌ WhatsApp rejection notification error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Send operator bank details rejected notification
 * Template variables: {{1}} = Business Name, {{2}} = Rejection Reason
 */
export async function sendOperatorBankRejectedNotification(params: {
    operatorId: string;
    reason: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!isWhatsAppConfigured()) {
            return { success: false, error: "WhatsApp not configured" };
        }

        const templateSid = TEMPLATES.OPERATOR_BANK_REJECTED;
        if (!templateSid) {
            console.warn("OPERATOR_BANK_REJECTED template not configured");
            return { success: false, error: "Template not configured" };
        }

        const operator = await db.operatorProfile.findUnique({
            where: { id: params.operatorId },
            select: { businessName: true, businessWhatsApp: true },
        });

        if (!operator?.businessWhatsApp) {
            return { success: false, error: "Operator WhatsApp not available" };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, error: "Failed to initialize client" };
        }

        const message = await client.messages.create({
            from: formatWhatsAppNumber(FROM_NUMBER!),
            to: formatWhatsAppNumber(operator.businessWhatsApp),
            contentSid: templateSid,
            contentVariables: JSON.stringify({
                "1": operator.businessName,
                "2": params.reason,
            }),
        });

        console.log(`✅ Bank rejection notification sent to ${operator.businessName}`);
        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error("❌ WhatsApp bank rejection error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Send new quote notification to operator
 * Template variables: {{1}} = Business Name, {{2}} = Customer Name, {{3}} = Tour Title, 
 *                     {{4}} = Reference, {{5}} = Guest Count, {{6}} = Preferred Date
 */
export async function sendNewQuoteNotificationToOperator(params: {
    quoteRequestId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!isWhatsAppConfigured()) {
            return { success: false, error: "WhatsApp not configured" };
        }

        const templateSid = TEMPLATES.OPERATOR_NEW_QUOTE;
        if (!templateSid) {
            console.warn("OPERATOR_NEW_QUOTE template not configured");
            return { success: false, error: "Template not configured" };
        }

        const quote = await db.quoteRequest.findUnique({
            where: { id: params.quoteRequestId },
            include: {
                tour: {
                    include: { operatorProfile: true },
                },
                user: true,
            },
        });

        if (!quote) {
            return { success: false, error: "Quote not found" };
        }

        if (!quote.tour.operatorProfile.businessWhatsApp) {
            return { success: false, error: "Operator WhatsApp not available" };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, error: "Failed to initialize client" };
        }

        const guestCount = `${quote.adults} adult${quote.adults > 1 ? "s" : ""}${quote.children > 0 ? `, ${quote.children} child${quote.children > 1 ? "ren" : ""}` : ""
            }`;

        const message = await client.messages.create({
            from: formatWhatsAppNumber(FROM_NUMBER!),
            to: formatWhatsAppNumber(quote.tour.operatorProfile.businessWhatsApp),
            contentSid: templateSid,
            contentVariables: JSON.stringify({
                "1": quote.tour.operatorProfile.businessName,
                "2": quote.user.name || "Customer",
                "3": quote.tour.title,
                "4": quote.reference,
                "5": guestCount,
                "6": new Date(quote.preferredDate).toLocaleDateString(),
            }),
        });

        console.log(`✅ New quote notification sent to operator`);
        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error("❌ New quote notification error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Send quality control message to operator (custom message)
 * Template variables: {{1}} = Business Name, {{2}} = Message Content
 */
export async function sendOperatorQualityControlMessage(params: {
    operatorId: string;
    message: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!isWhatsAppConfigured()) {
            return { success: false, error: "WhatsApp not configured" };
        }

        const templateSid = TEMPLATES.OPERATOR_QUALITY_CONTROL;
        if (!templateSid) {
            console.warn("OPERATOR_QUALITY_CONTROL template not configured");
            return { success: false, error: "Template not configured" };
        }

        const operator = await db.operatorProfile.findUnique({
            where: { id: params.operatorId },
            select: { businessName: true, businessWhatsApp: true },
        });

        if (!operator?.businessWhatsApp) {
            return { success: false, error: "Operator WhatsApp not available" };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, error: "Failed to initialize client" };
        }

        const twilioMessage = await client.messages.create({
            from: formatWhatsAppNumber(FROM_NUMBER!),
            to: formatWhatsAppNumber(operator.businessWhatsApp),
            contentSid: templateSid,
            contentVariables: JSON.stringify({
                "1": operator.businessName,
                "2": params.message,
            }),
        });

        console.log(`✅ Quality control message sent to ${operator.businessName}`);
        return { success: true, messageId: twilioMessage.sid };
    } catch (error: any) {
        console.error("❌ Quality control message error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Send new message notification to operator (customer messaged)
 * Template variables: {{1}} = Business Name, {{2}} = Customer Name, {{3}} = Tour Title, {{4}} = Reference
 */
export async function sendNewMessageToOperator(params: {
    quoteRequestId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!isWhatsAppConfigured()) {
            return { success: false, error: "WhatsApp not configured" };
        }

        const templateSid = TEMPLATES.OPERATOR_NEW_MESSAGE;
        if (!templateSid) {
            console.warn("OPERATOR_NEW_MESSAGE template not configured");
            return { success: false, error: "Template not configured" };
        }

        const quote = await db.quoteRequest.findUnique({
            where: { id: params.quoteRequestId },
            include: {
                tour: {
                    include: { operatorProfile: true },
                },
                user: true,
            },
        });

        if (!quote?.tour.operatorProfile.businessWhatsApp) {
            return { success: false, error: "Operator WhatsApp not available" };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, error: "Failed to initialize client" };
        }

        const message = await client.messages.create({
            from: formatWhatsAppNumber(FROM_NUMBER!),
            to: formatWhatsAppNumber(quote.tour.operatorProfile.businessWhatsApp),
            contentSid: templateSid,
            contentVariables: JSON.stringify({
                "1": quote.tour.operatorProfile.businessName,
                "2": quote.user.name || "Customer",
                "3": quote.tour.title,
                "4": quote.reference,
            }),
        });

        console.log(`✅ New message notification sent to operator`);
        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error("❌ New message notification error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Send quote response notification to customer
 * Template variables: {{1}} = Customer Name, {{2}} = Tour Title, {{3}} = Reference,
 *                     {{4}} = Quoted Price, {{5}} = Operator Name
 */
export async function sendQuoteResponseNotificationToCustomer(params: {
    quoteRequestId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!isWhatsAppConfigured()) {
            return { success: false, error: "WhatsApp not configured" };
        }

        const templateSid = TEMPLATES.CUSTOMER_QUOTE_RESPONSE;
        if (!templateSid) {
            console.warn("CUSTOMER_QUOTE_RESPONSE template not configured");
            return { success: false, error: "Template not configured" };
        }

        const quote = await db.quoteRequest.findUnique({
            where: { id: params.quoteRequestId },
            include: {
                tour: {
                    include: { operatorProfile: true },
                },
                user: true,
            },
        });

        if (!quote || !quote.user.phone) {
            return { success: false, error: "Quote or customer phone not found" };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, error: "Failed to initialize client" };
        }

        const message = await client.messages.create({
            from: formatWhatsAppNumber(FROM_NUMBER!),
            to: formatWhatsAppNumber(quote.user.phone),
            contentSid: templateSid,
            contentVariables: JSON.stringify({
                "1": quote.user.name || "Customer",
                "2": quote.tour.title,
                "3": quote.reference,
                "4": quote.quotedPrice ? `${formatPrice(quote.quotedPrice)}` : "TBC",
                "5": quote.tour.operatorProfile.businessName,
            }),
        });

        console.log(`✅ Quote response notification sent to customer`);
        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error("❌ Quote response notification error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Send payment success notification to customer
 * Template variables: {{1}} = Customer Name, {{2}} = Reference, {{3}} = Amount, {{4}} = Tour Title
 */
export async function sendPaymentSuccessWhatsApp(params: {
    quoteRequestId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!isWhatsAppConfigured()) {
            return { success: false, error: "WhatsApp not configured" };
        }

        const templateSid = TEMPLATES.CUSTOMER_PAYMENT_SUCCESS;
        if (!templateSid) {
            console.warn("CUSTOMER_PAYMENT_SUCCESS template not configured");
            return { success: false, error: "Template not configured" };
        }

        const quote = await db.quoteRequest.findUnique({
            where: { id: params.quoteRequestId },
            include: { tour: true, user: true },
        });

        if (!quote || !quote.user.phone) {
            return { success: false, error: "Quote or phone not found" };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, error: "Failed to initialize client" };
        }

        const message = await client.messages.create({
            from: formatWhatsAppNumber(FROM_NUMBER!),
            to: formatWhatsAppNumber(quote.user.phone),
            contentSid: templateSid,
            contentVariables: JSON.stringify({
                "1": quote.user.name || "Customer",
                "2": quote.reference,
                "3": `${formatPrice(quote.paidAmount || 0)}`,
                "4": quote.tour.title,
            }),
        });

        console.log(`✅ Payment success notification sent`);
        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error("❌ Payment success notification error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Send booking confirmation to customer
 * Template variables: {{1}} = Customer Name, {{2}} = Reference, {{3}} = Tour Title,
 *                     {{4}} = Date, {{5}} = Guests, {{6}} = Amount, {{7}} = Operator Name,
 *                     {{8}} = Operator Phone
 */
export async function sendBookingConfirmationWhatsApp(params: {
    quoteRequestId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!isWhatsAppConfigured()) {
            return { success: false, error: "WhatsApp not configured" };
        }

        const templateSid = TEMPLATES.CUSTOMER_BOOKING_CONFIRMATION;
        if (!templateSid) {
            console.warn("CUSTOMER_BOOKING_CONFIRMATION template not configured");
            return { success: false, error: "Template not configured" };
        }

        const quote = await db.quoteRequest.findUnique({
            where: { id: params.quoteRequestId },
            include: {
                tour: {
                    include: { operatorProfile: true },
                },
                user: true,
            },
        });

        if (!quote || !quote.user.phone) {
            return { success: false, error: "Quote or phone not found" };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, error: "Failed to initialize client" };
        }

        const guestCount = `${quote.adults} adult${quote.adults > 1 ? "s" : ""}${quote.children > 0 ? `, ${quote.children} child${quote.children > 1 ? "ren" : ""}` : ""
            }`;

        const message = await client.messages.create({
            from: formatWhatsAppNumber(FROM_NUMBER!),
            to: formatWhatsAppNumber(quote.user.phone),
            contentSid: templateSid,
            contentVariables: JSON.stringify({
                "1": quote.user.name || "Customer",
                "2": quote.reference,
                "3": quote.tour.title,
                "4": new Date(quote.preferredDate).toLocaleDateString(),
                "5": guestCount,
                "6": `${formatPrice(quote.paidAmount || 0)}`,
                "7": quote.tour.operatorProfile.businessName,
                "8": quote.tour.operatorProfile.businessPhone || "N/A",
            }),
        });

        console.log(`✅ Booking confirmation sent`);
        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error("❌ Booking confirmation error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Send quote expiring soon notification to customer
 * Template variables: {{1}} = Customer Name, {{2}} = Tour Title, {{3}} = Reference, {{4}} = Hours Until Expiry
 */
export async function sendQuoteExpiringNotification(params: {
    quoteRequestId: string;
    hoursUntilExpiry: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!isWhatsAppConfigured()) {
            return { success: false, error: "WhatsApp not configured" };
        }

        const templateSid = TEMPLATES.CUSTOMER_QUOTE_EXPIRING;
        if (!templateSid) {
            console.warn("CUSTOMER_QUOTE_EXPIRING template not configured");
            return { success: false, error: "Template not configured" };
        }

        const quote = await db.quoteRequest.findUnique({
            where: { id: params.quoteRequestId },
            include: { tour: true, user: true },
        });

        if (!quote || !quote.user.phone) {
            return { success: false, error: "Quote or phone not found" };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, error: "Failed to initialize client" };
        }

        const message = await client.messages.create({
            from: formatWhatsAppNumber(FROM_NUMBER!),
            to: formatWhatsAppNumber(quote.user.phone),
            contentSid: templateSid,
            contentVariables: JSON.stringify({
                "1": quote.user.name || "Customer",
                "2": quote.tour.title,
                "3": quote.reference,
                "4": params.hoursUntilExpiry.toString(),
            }),
        });

        console.log(`✅ Quote expiring notification sent`);
        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error("❌ Quote expiring notification error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Send tour completed notification to customer (for confirmation)
 * Template variables: {{1}} = Customer Name, {{2}} = Tour Title, {{3}} = Reference, {{4}} = Operator Name
 */
export async function sendTourCompletedNotification(params: {
    quoteRequestId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!isWhatsAppConfigured()) {
            return { success: false, error: "WhatsApp not configured" };
        }

        const templateSid = TEMPLATES.CUSTOMER_TOUR_COMPLETED;
        if (!templateSid) {
            console.warn("CUSTOMER_TOUR_COMPLETED template not configured");
            return { success: false, error: "Template not configured" };
        }

        const quote = await db.quoteRequest.findUnique({
            where: { id: params.quoteRequestId },
            include: {
                tour: {
                    include: { operatorProfile: true },
                },
                user: true,
            },
        });

        if (!quote || !quote.user.phone) {
            return { success: false, error: "Quote or phone not found" };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, error: "Failed to initialize client" };
        }

        const message = await client.messages.create({
            from: formatWhatsAppNumber(FROM_NUMBER!),
            to: formatWhatsAppNumber(quote.user.phone),
            contentSid: templateSid,
            contentVariables: JSON.stringify({
                "1": quote.user.name || "Customer",
                "2": quote.tour.title,
                "3": quote.reference,
                "4": quote.tour.operatorProfile.businessName,
            }),
        });

        console.log(`✅ Tour completed notification sent to customer`);
        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error("❌ Tour completed notification error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Send new message notification to customer (operator messaged)
 * Template variables: {{1}} = Customer Name, {{2}} = Operator Name, {{3}} = Tour Title, {{4}} = Reference
 */
export async function sendNewMessageToCustomer(params: {
    quoteRequestId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!isWhatsAppConfigured()) {
            return { success: false, error: "WhatsApp not configured" };
        }

        const templateSid = TEMPLATES.CUSTOMER_NEW_MESSAGE;
        if (!templateSid) {
            console.warn("CUSTOMER_NEW_MESSAGE template not configured");
            return { success: false, error: "Template not configured" };
        }

        const quote = await db.quoteRequest.findUnique({
            where: { id: params.quoteRequestId },
            include: {
                tour: {
                    include: { operatorProfile: true },
                },
                user: true,
            },
        });

        if (!quote || !quote.user.phone) {
            return { success: false, error: "Quote or phone not found" };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, error: "Failed to initialize client" };
        }

        const message = await client.messages.create({
            from: formatWhatsAppNumber(FROM_NUMBER!),
            to: formatWhatsAppNumber(quote.user.phone),
            contentSid: templateSid,
            contentVariables: JSON.stringify({
                "1": quote.user.name || "Customer",
                "2": quote.tour.operatorProfile.businessName,
                "3": quote.tour.title,
                "4": quote.reference,
            }),
        });

        console.log(`✅ New message notification sent to customer`);
        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error("❌ New message notification error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if WhatsApp service is available
 */
export async function checkWhatsAppStatus(): Promise<{
    configured: boolean;
    templates: {
        operatorApproved: boolean;
        operatorRejected: boolean;
        operatorBankRejected: boolean;
        operatorNewQuote: boolean;
        operatorQualityControl: boolean;
        operatorNewMessage: boolean;
        customerQuoteResponse: boolean;
        customerPaymentSuccess: boolean;
        customerBookingConfirmation: boolean;
        customerQuoteExpiring: boolean;
        customerTourCompleted: boolean;
        customerNewMessage: boolean;
    };
}> {
    return {
        configured: isWhatsAppConfigured(),
        templates: {
            operatorApproved: !!TEMPLATES.OPERATOR_APPLICATION_APPROVED,
            operatorRejected: !!TEMPLATES.OPERATOR_APPLICATION_REJECTED,
            operatorBankRejected: !!TEMPLATES.OPERATOR_BANK_REJECTED,
            operatorNewQuote: !!TEMPLATES.OPERATOR_NEW_QUOTE,
            operatorQualityControl: !!TEMPLATES.OPERATOR_QUALITY_CONTROL,
            operatorNewMessage: !!TEMPLATES.OPERATOR_NEW_MESSAGE,
            customerQuoteResponse: !!TEMPLATES.CUSTOMER_QUOTE_RESPONSE,
            customerPaymentSuccess: !!TEMPLATES.CUSTOMER_PAYMENT_SUCCESS,
            customerBookingConfirmation: !!TEMPLATES.CUSTOMER_BOOKING_CONFIRMATION,
            customerQuoteExpiring: !!TEMPLATES.CUSTOMER_QUOTE_EXPIRING,
            customerTourCompleted: !!TEMPLATES.CUSTOMER_TOUR_COMPLETED,
            customerNewMessage: !!TEMPLATES.CUSTOMER_NEW_MESSAGE,
        },
    };
}
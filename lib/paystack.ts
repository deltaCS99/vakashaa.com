// lib/paystack.ts
"use server";

import { db } from "@/lib/db";
import {
    sendPaymentSuccessWhatsApp,
    sendBookingConfirmationWhatsApp
} from "@/lib/whatsapp";

if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not set");
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * Initialize a payment - Returns checkout URL for redirect
 */
export async function initializePayment(params: {
    email: string;
    amount: number; // Amount in cents (e.g., 50000 = R500.00)
    reference: string;
    metadata?: Record<string, any>;
}) {
    try {
        const response = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: params.email,
                amount: params.amount,
                reference: params.reference,
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
                metadata: params.metadata,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Payment initialization failed");
        }

        const data = await response.json();

        return {
            success: true,
            authorizationUrl: data.data.authorization_url,
            reference: data.data.reference,
        };
    } catch (error) {
        console.error("Payment initialization error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Payment initialization failed",
        };
    }
}

/**
 * Verify payment after callback
 */
export async function verifyPayment(reference: string) {
    try {
        const response = await fetch(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Payment verification failed");
        }

        const data = await response.json();

        return {
            success: data.data.status === "success",
            amount: data.data.amount,
            status: data.data.status,
            paidAt: data.data.paid_at,
        };
    } catch (error) {
        console.error("Payment verification error:", error);
        return {
            success: false,
            error: "Payment verification failed",
        };
    }
}

/**
 * Handle Paystack webhook (for payment confirmation)
 * Use this in app/api/webhooks/paystack/route.ts
 */
export async function handlePaystackWebhook(payload: any) {
    try {
        const event = payload.event;
        const data = payload.data;

        if (event === "charge.success") {
            const reference = data.reference;
            const amount = data.amount;
            const paidAt = data.paid_at;

            // Find quote request
            const quoteRequest = await db.quoteRequest.findFirst({
                where: { paymentReference: reference },
            });

            if (!quoteRequest) {
                console.error("Quote request not found for webhook reference:", reference);
                return { success: false, error: "Quote not found" };
            }

            // Check if already processed
            if (quoteRequest.status === "Paid") {
                console.log(`Payment already processed for ${reference}`);
                return { success: true, message: "Already processed" };
            }

            // Update to paid
            await db.quoteRequest.update({
                where: { id: quoteRequest.id },
                data: {
                    status: "Paid",
                    paidAt: new Date(paidAt),
                    paidAmount: amount,
                },
            });

            // Send WhatsApp notifications
            await sendPaymentSuccessWhatsApp({ quoteRequestId: quoteRequest.id });
            await sendBookingConfirmationWhatsApp({ quoteRequestId: quoteRequest.id });

            console.log(`✅ Webhook: Payment confirmed for ${reference}`);

            return { success: true };
        }

        return { success: true, message: "Event not handled" };
    } catch (error) {
        console.error("❌ Webhook error:", error);
        return { success: false, error: "Webhook processing failed" };
    }
}
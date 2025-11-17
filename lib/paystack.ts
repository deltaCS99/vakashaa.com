// lib/paystack.ts
"use server";

import { db } from "@/lib/db";

if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not set");
}

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Types
interface PaystackResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

interface TransactionData {
    authorization_url: string;
    access_code: string;
    reference: string;
}

interface VerifyAccountData {
    account_number: string;
    account_name: string;
    bank_id: number;
}

// Helper function for API calls
async function paystackRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" = "GET",
    body?: any
): Promise<PaystackResponse<T>> {
    const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
        method,
        headers: {
            Authorization: `Bearer ${SECRET_KEY}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Paystack API request failed");
    }

    return response.json();
}

/**
 * Verify bank account details (for operator verification)
 */
export async function verifyBankAccount(
    accountNumber: string,
    bankCode: string
): Promise<{ accountName: string; accountNumber: string }> {
    try {
        const result = await paystackRequest<VerifyAccountData>(
            `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
            "GET"
        );

        return {
            accountName: result.data.account_name,
            accountNumber: result.data.account_number,
        };
    } catch (error) {
        console.error("Error verifying bank account:", error);
        throw new Error("Failed to verify bank account details");
    }
}

/**
 * Initialize a payment transaction (100% to platform)
 */
export async function initializeTransaction(params: {
    email: string;
    amount: number; // Amount in cents
    reference?: string;
    callbackUrl?: string;
    metadata?: Record<string, any>;
}): Promise<{ authorizationUrl: string; reference: string; accessCode: string }> {
    try {
        const result = await paystackRequest<TransactionData>(
            "/transaction/initialize",
            "POST",
            {
                email: params.email,
                amount: params.amount,
                reference: params.reference,
                callback_url: params.callbackUrl,
                metadata: params.metadata,
            }
        );

        return {
            authorizationUrl: result.data.authorization_url,
            reference: result.data.reference,
            accessCode: result.data.access_code,
        };
    } catch (error) {
        console.error("Error initializing transaction:", error);
        throw error;
    }
}

/**
 * Verify a transaction
 */
export async function verifyTransaction(reference: string): Promise<{
    status: string;
    amount: number;
    paidAt: Date | null;
    reference: string;
    channel: string;
    currency: string;
}> {
    try {
        const result = await paystackRequest<any>(
            `/transaction/verify/${reference}`,
            "GET"
        );

        return {
            status: result.data.status,
            amount: result.data.amount,
            paidAt: result.data.paid_at ? new Date(result.data.paid_at) : null,
            reference: result.data.reference,
            channel: result.data.channel,
            currency: result.data.currency,
        };
    } catch (error) {
        console.error("Error verifying transaction:", error);
        throw error;
    }
}

/**
 * Generate payment link for a quote request
 * All payments go to platform account - payouts handled manually
 */
export async function generateQuotePaymentLink(quoteRequestId: string): Promise<string> {
    try {
        // Get quote request with tour and user details
        const quoteRequest = await db.quoteRequest.findUnique({
            where: { id: quoteRequestId },
            include: {
                tour: {
                    include: {
                        operatorProfile: true,
                    },
                },
                user: true,
            },
        });

        if (!quoteRequest) {
            throw new Error("Quote request not found");
        }

        if (!quoteRequest.quotedPrice) {
            throw new Error("Quote has no price set");
        }

        if (quoteRequest.status !== "Accepted") {
            throw new Error("Quote must be accepted before generating payment link");
        }

        if (!quoteRequest.user.email) {
            throw new Error("Customer email is required for payment");
        }

        // Generate unique reference
        const reference = `BK-${quoteRequest.reference}-${Date.now()}`;

        // Get callback URL from settings or use default
        const callbackUrlSetting = await db.setting.findUnique({
            where: { key: "payment_callback_url" },
        });

        const callbackUrl = callbackUrlSetting?.value ||
            `${process.env.NEXT_PUBLIC_APP_URL}/quotes/${quoteRequestId}/payment/callback`;

        // Initialize transaction (100% to platform)
        const transaction = await initializeTransaction({
            email: quoteRequest.user.email,
            amount: quoteRequest.quotedPrice,
            reference: reference,
            callbackUrl: callbackUrl,
            metadata: {
                quoteRequestId: quoteRequest.id,
                quoteReference: quoteRequest.reference,
                tourId: quoteRequest.tour.id,
                tourTitle: quoteRequest.tour.title,
                operatorProfileId: quoteRequest.tour.operatorProfileId,
                operatorName: quoteRequest.tour.operatorProfile.businessName,
                customerName: quoteRequest.user.name,
                customerEmail: quoteRequest.user.email,
                adults: quoteRequest.adults,
                children: quoteRequest.children,
                tourDate: quoteRequest.confirmedTourDate?.toISOString(),
            },
        });

        // Update quote request with payment details
        await db.quoteRequest.update({
            where: { id: quoteRequestId },
            data: {
                paymentLink: transaction.authorizationUrl,
                paymentReference: transaction.reference,
            },
        });

        return transaction.authorizationUrl;
    } catch (error) {
        console.error("Error generating quote payment link:", error);
        throw error;
    }
}

/**
 * Handle payment webhook/callback
 */
export async function handlePaymentCallback(reference: string): Promise<{
    success: boolean;
    quoteRequestId?: string;
    message: string;
}> {
    try {
        // Verify transaction with Paystack
        const transaction = await verifyTransaction(reference);

        if (transaction.status !== "success") {
            console.log(`Transaction ${reference} not successful: ${transaction.status}`);
            return {
                success: false,
                message: `Payment not successful: ${transaction.status}`,
            };
        }

        // Find quote request by payment reference
        const quoteRequest = await db.quoteRequest.findFirst({
            where: { paymentReference: reference },
            include: {
                tour: {
                    include: {
                        operatorProfile: true,
                    },
                },
                user: true,
            },
        });

        if (!quoteRequest) {
            throw new Error(`Quote request not found for reference: ${reference}`);
        }

        // Check if already paid (prevent duplicate processing)
        if (quoteRequest.status === "Paid") {
            console.log(`Quote ${quoteRequest.reference} already marked as paid`);
            return {
                success: true,
                quoteRequestId: quoteRequest.id,
                message: "Payment already processed",
            };
        }

        // Update quote to paid status
        await db.quoteRequest.update({
            where: { id: quoteRequest.id },
            data: {
                status: "Paid",
                paidAt: transaction.paidAt,
                paidAmount: transaction.amount,
            },
        });

        console.log(`✅ Payment successful for quote ${quoteRequest.reference}`);
        console.log(`   Amount: R${(transaction.amount / 100).toLocaleString()}`);
        console.log(`   Operator: ${quoteRequest.tour.operatorProfile.businessName}`);
        console.log(`   Customer: ${quoteRequest.user.name}`);

        // TODO: Send confirmation emails to customer and operator
        // TODO: Create notification for admin dashboard
        // TODO: Add to payout queue for operator

        return {
            success: true,
            quoteRequestId: quoteRequest.id,
            message: "Payment processed successfully",
        };
    } catch (error) {
        console.error("❌ Error handling payment callback:", error);
        throw error;
    }
}

/**
 * Get list of South African banks for bank account verification
 */
export async function getSouthAfricanBanks(): Promise<Array<{
    id: number;
    name: string;
    code: string;
}>> {
    try {
        const result = await paystackRequest<any>(
            "/bank?country=south%20africa",
            "GET"
        );

        return result.data.map((bank: any) => ({
            id: bank.id,
            name: bank.name,
            code: bank.code,
        }));
    } catch (error) {
        console.error("Error fetching banks:", error);
        throw new Error("Failed to fetch bank list");
    }
}
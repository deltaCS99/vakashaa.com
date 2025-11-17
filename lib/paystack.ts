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

interface SubaccountData {
    subaccount_code: string;
    business_name: string;
    account_number: string;
    bank_code: string;
    percentage_charge: number;
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
 * Verify bank account details
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
 * Create a subaccount for an operator
 */
export async function createSubaccount(params: {
    businessName: string;
    bankCode: string;
    accountNumber: string;
    percentageCharge: number;
    description?: string;
}): Promise<string> {
    try {
        // First verify the account
        const verified = await verifyBankAccount(params.accountNumber, params.bankCode);

        console.log(`Verified account: ${verified.accountName} - ${verified.accountNumber}`);

        // Create subaccount
        const result = await paystackRequest<SubaccountData>(
            "/subaccount",
            "POST",
            {
                business_name: params.businessName,
                bank_code: params.bankCode,
                account_number: params.accountNumber,
                percentage_charge: params.percentageCharge,
                description: params.description || `Subaccount for ${params.businessName}`,
            }
        );

        return result.data.subaccount_code;
    } catch (error) {
        console.error("Error creating subaccount:", error);
        throw error;
    }
}

/**
 * Initialize a split payment transaction
 */
export async function initializeTransaction(params: {
    email: string;
    amount: number; // Amount in cents
    subaccountCode: string;
    transactionCharge: number; // Flat fee for main account in cents
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
                subaccount: params.subaccountCode,
                transaction_charge: params.transactionCharge,
                bearer: "subaccount", // Operator pays Paystack fees
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
        };
    } catch (error) {
        console.error("Error verifying transaction:", error);
        throw error;
    }
}

/**
 * Get or create subaccount for an operator
 * Returns the subaccount code, creating one if it doesn't exist
 */
export async function getOrCreateOperatorSubaccount(
    operatorProfileId: string
): Promise<string> {
    try {
        // Get operator profile with bank details
        const operatorProfile = await db.operatorProfile.findUnique({
            where: { id: operatorProfileId },
            select: {
                id: true,
                businessName: true,
                paystackSubaccountCode: true,
                bankName: true,
                bankCode: true,
                accountNumber: true,
                accountName: true,
            },
        });

        if (!operatorProfile) {
            throw new Error("Operator profile not found");
        }

        // Return existing subaccount if available
        if (operatorProfile.paystackSubaccountCode) {
            return operatorProfile.paystackSubaccountCode;
        }

        // Validate bank details
        if (!operatorProfile.bankCode || !operatorProfile.accountNumber) {
            throw new Error(
                "Operator bank details are incomplete. Please update bank information."
            );
        }

        // Get platform commission from settings
        const commissionSetting = await db.setting.findUnique({
            where: { key: "platform_commission_rate" },
        });

        const commissionRate = commissionSetting
            ? parseFloat(commissionSetting.value)
            : 7; // Default 7%

        // Create subaccount
        const subaccountCode = await createSubaccount({
            businessName: operatorProfile.businessName,
            bankCode: operatorProfile.bankCode,
            accountNumber: operatorProfile.accountNumber,
            percentageCharge: commissionRate,
            description: `Tour operator: ${operatorProfile.businessName}`,
        });

        // Save subaccount code to database
        await db.operatorProfile.update({
            where: { id: operatorProfileId },
            data: { paystackSubaccountCode: subaccountCode },
        });

        return subaccountCode;
    } catch (error) {
        console.error("Error getting/creating operator subaccount:", error);
        throw error;
    }
}

/**
 * Generate payment link for a quote request
 */
export async function generateQuotePaymentLink(quoteRequestId: string): Promise<string> {
    try {
        // Get quote request with tour and operator details
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

        // Get or create operator's subaccount
        const subaccountCode = await getOrCreateOperatorSubaccount(
            quoteRequest.tour.operatorProfileId
        );

        // Get platform commission from settings
        const commissionSetting = await db.setting.findUnique({
            where: { key: "platform_commission_rate" },
        });

        const commissionRate = commissionSetting
            ? parseFloat(commissionSetting.value)
            : 7; // Default 7%

        // Calculate flat commission (in cents)
        const transactionCharge = Math.round((quoteRequest.quotedPrice * commissionRate) / 100);

        // Generate unique reference
        const reference = `BK-${quoteRequest.reference}-${Date.now()}`;

        // Get callback URL from settings or use default
        const callbackUrlSetting = await db.setting.findUnique({
            where: { key: "payment_callback_url" },
        });

        const callbackUrl = callbackUrlSetting?.value ||
            `${process.env.NEXT_PUBLIC_APP_URL}/quotes/${quoteRequestId}/payment/callback`;

        // Initialize transaction
        const transaction = await initializeTransaction({
            email: quoteRequest.user.email!,
            amount: quoteRequest.quotedPrice,
            subaccountCode: subaccountCode,
            transactionCharge: transactionCharge,
            reference: reference,
            callbackUrl: callbackUrl,
            metadata: {
                quoteRequestId: quoteRequest.id,
                quoteReference: quoteRequest.reference,
                tourTitle: quoteRequest.tour.title,
                customerName: quoteRequest.user.name,
                operatorName: quoteRequest.tour.operatorProfile.businessName,
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
export async function handlePaymentCallback(reference: string): Promise<void> {
    try {
        // Verify transaction with Paystack
        const transaction = await verifyTransaction(reference);

        if (transaction.status !== "success") {
            console.log(`Transaction ${reference} not successful: ${transaction.status}`);
            return;
        }

        // Find quote request by payment reference
        const quoteRequest = await db.quoteRequest.findFirst({
            where: { paymentReference: reference },
        });

        if (!quoteRequest) {
            throw new Error(`Quote request not found for reference: ${reference}`);
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

        console.log(`Payment successful for quote ${quoteRequest.reference}`);

        // TODO: Send confirmation emails to customer and operator
    } catch (error) {
        console.error("Error handling payment callback:", error);
        throw error;
    }
}
// actions/operator/quotes.ts
"use server";

import { db } from "@/lib/db";
import { requireApprovedOperator } from "@/lib/operator";
import { response } from "@/lib/utils";
import { QuoteStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Get all quote requests for operator's tours
export const getOperatorQuoteRequests = async () => {
    try {
        const operatorProfile = await requireApprovedOperator();

        const quoteRequests = await db.quoteRequest.findMany({
            where: {
                tour: {
                    operatorProfileId: operatorProfile.id,
                },
            },
            include: {
                tour: {
                    select: {
                        id: true,
                        title: true,
                        images: true,
                        duration: true,
                    },
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 1,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return response({
            success: true,
            code: 200,
            data: { quoteRequests },
        });
    } catch (error: any) {
        console.error("Error fetching operator quotes:", error);
        return response({
            success: false,
            error: {
                code: error.message.includes("pending approval") ? 403 : 500,
                message: error.message || "Failed to fetch quote requests.",
            },
        });
    }
};

// Get single quote request details
export const getOperatorQuoteRequestById = async (id: string) => {
    try {
        const operatorProfile = await requireApprovedOperator();

        const quoteRequest = await db.quoteRequest.findFirst({
            where: {
                id,
                tour: {
                    operatorProfileId: operatorProfile.id,
                },
            },
            include: {
                tour: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        whatsappNumber: true,
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        if (!quoteRequest) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Quote request not found.",
                },
            });
        }

        return response({
            success: true,
            code: 200,
            data: { quoteRequest },
        });
    } catch (error: any) {
        console.error("Error fetching quote request:", error);
        return response({
            success: false,
            error: {
                code: error.message.includes("pending approval") ? 403 : 500,
                message: error.message || "Failed to fetch quote request.",
            },
        });
    }
};

interface RespondToQuoteParams {
    quoteRequestId: string;
    quotedPrice: number; // In cents
    quotedInclusions?: Array<{ item: string; price: number | null }>;
    quotedExclusions?: Array<{ item: string; price: number | null }>;
    quotedTerms?: string;
    quoteValidityHours?: number;
}

// Respond to a quote request (or revise existing quote)
export const respondToQuote = async (params: RespondToQuoteParams) => {
    try {
        const operatorProfile = await requireApprovedOperator();

        // Verify quote belongs to operator's tour
        const quoteRequest = await db.quoteRequest.findFirst({
            where: {
                id: params.quoteRequestId,
                tour: {
                    operatorProfileId: operatorProfile.id,
                },
            },
        });

        if (!quoteRequest) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Quote request not found.",
                },
            });
        }

        // Check if this is a revision or initial quote
        const isRevision = quoteRequest.status !== QuoteStatus.Pending;

        // Cannot revise if customer already accepted or paid
        if (
            isRevision &&
            [QuoteStatus.Accepted, QuoteStatus.Paid as QuoteStatus].includes(quoteRequest.status)
        ) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Cannot revise quote after customer has accepted or paid.",
                },
            });
        }

        // Calculate expiry
        const quotedAt = new Date();
        const quoteExpiresAt = params.quoteValidityHours
            ? new Date(quotedAt.getTime() + params.quoteValidityHours * 60 * 60 * 1000)
            : new Date(quotedAt.getTime() + 72 * 60 * 60 * 1000); // Default 72 hours

        // Update quote with response
        const updatedQuote = await db.quoteRequest.update({
            where: { id: params.quoteRequestId },
            data: {
                status: QuoteStatus.Quoted,
                quotedPrice: params.quotedPrice,
                quotedInclusions: params.quotedInclusions || [],
                quotedExclusions: params.quotedExclusions || [],
                quotedTerms: params.quotedTerms,
                quoteValidityHours: params.quoteValidityHours || 72,
                quotedAt,
                quoteExpiresAt,
                // Increment revision count if this is a revision
                revisionCount: isRevision ? quoteRequest.revisionCount + 1 : 0,
                lastRevisedAt: isRevision ? quotedAt : null,
            },
        });

        // TODO: Send email notification to customer

        revalidatePath("/operator/quotes");
        revalidatePath(`/operator/quotes/${params.quoteRequestId}`);

        return response({
            success: true,
            code: 200,
            data: { quoteRequest: updatedQuote },
        });
    } catch (error: any) {
        console.error("Error responding to quote:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to submit quote response.",
            },
        });
    }
};

// Send message on quote
export const sendOperatorMessage = async (
    quoteRequestId: string,
    message: string
) => {
    try {
        const operatorProfile = await requireApprovedOperator();

        // Verify quote belongs to operator
        const quoteRequest = await db.quoteRequest.findFirst({
            where: {
                id: quoteRequestId,
                tour: {
                    operatorProfileId: operatorProfile.id,
                },
            },
        });

        if (!quoteRequest) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Quote request not found.",
                },
            });
        }

        // Create message
        const quoteMessage = await db.quoteMessage.create({
            data: {
                quoteRequestId,
                senderId: operatorProfile.userId,
                senderType: "operator",
                message,
            },
        });

        // TODO: Send notification to customer

        return response({
            success: true,
            code: 201,
            data: { message: quoteMessage },
        });
    } catch (error) {
        console.error("Error sending message:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to send message.",
            },
        });
    }
};
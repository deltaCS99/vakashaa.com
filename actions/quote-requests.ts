// actions/quote-requests.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { QuoteStatus } from "@prisma/client";

interface CreateQuoteRequestParams {
    tourId: string;
    preferredDate: string;
    flexibleDates: boolean;
    adults: number;
    children: number;
    childAges?: number[];
    budgetRange?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerWhatsapp?: string;
    specialRequirements: string;
}

// Generate unique quote reference
function generateQuoteReference(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QR-${timestamp}${random}`;
}

export const createQuoteRequest = async (params: CreateQuoteRequestParams) => {
    try {
        const user = await currentUser();

        if (!user) {
            return response({
                success: false,
                error: {
                    code: 401,
                    message: "You must be logged in to request a quote.",
                },
            });
        }

        // Validate tour exists and is active
        const tour = await db.tour.findFirst({
            where: {
                id: params.tourId,
                isActive: true,
                operatorProfile: {
                    isApproved: true,
                },
            },
            select: {
                id: true,
                title: true,
                maxCapacity: true,
                operatorProfileId: true,
            },
        });

        if (!tour) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Tour not found or no longer available.",
                },
            });
        }

        // Validate capacity
        const totalGuests = params.adults + params.children;
        if (tour.maxCapacity && totalGuests > tour.maxCapacity) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: `This tour has a maximum capacity of ${tour.maxCapacity} guests.`,
                },
            });
        }

        // Validate date is in the future
        const selectedDate = new Date(params.preferredDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Preferred date must be in the future.",
                },
            });
        }

        // Generate unique reference
        let reference = generateQuoteReference();
        let referenceExists = await db.quoteRequest.findUnique({
            where: { reference },
        });

        // Ensure uniqueness
        while (referenceExists) {
            reference = generateQuoteReference();
            referenceExists = await db.quoteRequest.findUnique({
                where: { reference },
            });
        }

        // Create quote request
        const quoteRequest = await db.quoteRequest.create({
            data: {
                reference,
                userId: user.id!,
                tourId: params.tourId,
                preferredDate: params.preferredDate,
                flexibleDates: params.flexibleDates,
                adults: params.adults,
                children: params.children,
                childAges: params.childAges || [],
                budgetRange: params.budgetRange,
                customerName: params.customerName,
                customerEmail: params.customerEmail,
                customerPhone: params.customerPhone,
                customerWhatsApp: params.customerWhatsapp,
                specialRequirements: params.specialRequirements,
                status: QuoteStatus.Pending,
            },
            include: {
                tour: {
                    select: {
                        title: true,
                    },
                },
            },
        });

        // TODO: Send notification email to operator
        // TODO: Send confirmation email to customer

        return response({
            success: true,
            code: 201,
            data: {
                quoteRequest: {
                    id: quoteRequest.id,
                    reference: quoteRequest.reference,
                    status: quoteRequest.status,
                },
            },
        });
    } catch (error) {
        console.error("Error creating quote request:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to submit quote request. Please try again.",
            },
        });
    }
};

// Get user's quote requests
export const getUserQuoteRequests = async () => {
    try {
        const user = await currentUser();

        if (!user) {
            return response({
                success: false,
                error: {
                    code: 401,
                    message: "You must be logged in.",
                },
            });
        }

        const quoteRequests = await db.quoteRequest.findMany({
            where: {
                userId: user.id,
            },
            include: {
                tour: {
                    select: {
                        id: true,
                        title: true,
                        images: true,
                        duration: true,
                        countries: true,
                        region: true,
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return response({
            success: true,
            code: 200,
            data: { quoteRequests },
        });
    } catch (error) {
        console.error("Error fetching quote requests:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch quote requests.",
            },
        });
    }
};

// Get single quote request with full details
export const getQuoteRequestById = async (id: string) => {
    try {
        const user = await currentUser();

        if (!user) {
            return response({
                success: false,
                error: {
                    code: 401,
                    message: "You must be logged in.",
                },
            });
        }

        const quoteRequest = await db.quoteRequest.findFirst({
            where: {
                id,
                userId: user.id, // Ensure user owns this quote request
            },
            include: {
                tour: true, // Get all tour fields
                messages: {
                    orderBy: {
                        createdAt: 'asc',
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

        // Parse JSON fields if they're strings
        const parsedQuoteRequest = {
            ...quoteRequest,
            quotedInclusions: quoteRequest.quotedInclusions
                ? typeof quoteRequest.quotedInclusions === 'string'
                    ? JSON.parse(quoteRequest.quotedInclusions)
                    : quoteRequest.quotedInclusions
                : null,
            quotedExclusions: quoteRequest.quotedExclusions
                ? typeof quoteRequest.quotedExclusions === 'string'
                    ? JSON.parse(quoteRequest.quotedExclusions)
                    : quoteRequest.quotedExclusions
                : null,
        };

        return response({
            success: true,
            code: 200,
            data: { quoteRequest: parsedQuoteRequest },
        });
    } catch (error) {
        console.error("Error fetching quote request:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch quote request details.",
            },
        });
    }
};

// Send message in quote conversation
export const sendQuoteMessage = async (quoteRequestId: string, message: string) => {
    try {
        const user = await currentUser();

        if (!user) {
            return response({
                success: false,
                error: {
                    code: 401,
                    message: "You must be logged in.",
                },
            });
        }

        // Verify user owns this quote request
        const quoteRequest = await db.quoteRequest.findFirst({
            where: {
                id: quoteRequestId,
                userId: user.id,
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
                senderId: user.id!,
                senderType: "customer",
                message,
            },
        });

        // TODO: Send notification to operator

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

// Accept a quote
export const acceptQuote = async (quoteRequestId: string) => {
    try {
        const user = await currentUser();

        if (!user) {
            return response({
                success: false,
                error: {
                    code: 401,
                    message: "You must be logged in.",
                },
            });
        }

        // Verify quote exists and belongs to user
        const quoteRequest = await db.quoteRequest.findFirst({
            where: {
                id: quoteRequestId,
                userId: user.id,
                status: QuoteStatus.Quoted,
            },
        });

        if (!quoteRequest) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Quote not found or cannot be accepted.",
                },
            });
        }

        // Check if quote has expired
        if (quoteRequest.quoteExpiresAt && new Date() > quoteRequest.quoteExpiresAt) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "This quote has expired. Please request a new quote.",
                },
            });
        }

        // Update status to Accepted
        const updatedQuote = await db.quoteRequest.update({
            where: { id: quoteRequestId },
            data: {
                status: QuoteStatus.Accepted,
                acceptedAt: new Date(),
            },
        });

        // TODO: Generate payment link
        // TODO: Send confirmation email to customer
        // TODO: Notify operator

        return response({
            success: true,
            code: 200,
            data: { quoteRequest: updatedQuote },
        });
    } catch (error) {
        console.error("Error accepting quote:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to accept quote.",
            },
        });
    }
};

// Reject a quote
export const rejectQuote = async (quoteRequestId: string, reason?: string) => {
    try {
        const user = await currentUser();

        if (!user) {
            return response({
                success: false,
                error: {
                    code: 401,
                    message: "You must be logged in.",
                },
            });
        }

        // Verify quote exists and belongs to user
        const quoteRequest = await db.quoteRequest.findFirst({
            where: {
                id: quoteRequestId,
                userId: user.id,
                status: QuoteStatus.Quoted,
            },
        });

        if (!quoteRequest) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Quote not found or cannot be rejected.",
                },
            });
        }

        // Update status to Rejected
        const updatedQuote = await db.quoteRequest.update({
            where: { id: quoteRequestId },
            data: {
                status: QuoteStatus.Rejected,
                rejectedAt: new Date(),
                rejectionReason: reason,
            },
        });

        // TODO: Notify operator

        return response({
            success: true,
            code: 200,
            data: { quoteRequest: updatedQuote },
        });
    } catch (error) {
        console.error("Error rejecting quote:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to reject quote.",
            },
        });
    }
};

// Cancel a quote request (before quoted or after accepted)
export const cancelQuoteRequest = async (quoteRequestId: string, reason?: string) => {
    try {
        const user = await currentUser();

        if (!user) {
            return response({
                success: false,
                error: {
                    code: 401,
                    message: "You must be logged in.",
                },
            });
        }

        // Verify quote exists and belongs to user
        const quoteRequest = await db.quoteRequest.findFirst({
            where: {
                id: quoteRequestId,
                userId: user.id,
                status: {
                    in: [QuoteStatus.Pending, QuoteStatus.Quoted, QuoteStatus.Accepted],
                },
            },
        });

        if (!quoteRequest) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Quote request not found or cannot be cancelled.",
                },
            });
        }

        // Cannot cancel if already paid
        if (quoteRequest.status === QuoteStatus.Paid) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Cannot cancel a paid booking. Please contact support.",
                },
            });
        }

        // Update status to Cancelled
        const updatedQuote = await db.quoteRequest.update({
            where: { id: quoteRequestId },
            data: {
                status: QuoteStatus.Cancelled,
                cancelledAt: new Date(),
                cancellationReason: reason,
            },
        });

        // TODO: Notify operator
        // TODO: Process refund if there was a deposit

        return response({
            success: true,
            code: 200,
            data: { quoteRequest: updatedQuote },
        });
    } catch (error) {
        console.error("Error cancelling quote request:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to cancel quote request.",
            },
        });
    }
};
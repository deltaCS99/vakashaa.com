// actions/bookings.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { QuoteStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Get customer's bookings
export const getCustomerBookings = async () => {
    try {
        const user = await currentUser();

        if (!user) {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        const bookings = await db.quoteRequest.findMany({
            where: {
                userId: user.id,
                status: { in: [QuoteStatus.Paid, QuoteStatus.Completed, QuoteStatus.Disputed] }
            },
            include: {
                tour: {
                    select: {
                        id: true,
                        title: true,
                        images: true,
                    },
                },
            },
            orderBy: {
                confirmedTourDate: "asc",
            },
        });

        return response({
            success: true,
            code: 200,
            data: { bookings },
        });
    } catch (error: any) {
        console.error("Error fetching bookings:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch bookings.",
            },
        });
    }
};

// Get a single booking by ID
export const getCustomerBookingById = async (bookingId: string) => {
    try {
        const user = await currentUser();

        if (!user) {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        const booking = await db.quoteRequest.findFirst({
            where: {
                id: bookingId,
                userId: user.id,
                status: QuoteStatus.Paid,
            },
            include: {
                tour: {
                    include: {
                        operatorProfile: {
                            select: {
                                businessName: true,
                                businessPhone: true,
                                businessWhatsApp: true,
                            },
                        },
                    },
                },
            },
        });

        if (!booking) {
            return response({
                success: false,
                error: { code: 404, message: "Booking not found" },
            });
        }

        return response({
            success: true,
            code: 200,
            data: { booking },
        });
    } catch (error: any) {
        console.error("Error fetching booking:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch booking.",
            },
        });
    }
};

// Confirm tour completion
export const confirmTourCompletion = async (quoteRequestId: string) => {
    try {
        const user = await currentUser();

        if (!user) {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        // Verify booking belongs to user
        const booking = await db.quoteRequest.findFirst({
            where: {
                id: quoteRequestId,
                userId: user.id,
                status: QuoteStatus.Paid,
            },
        });

        if (!booking) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Booking not found.",
                },
            });
        }

        // Check if operator marked complete
        if (!booking.tourCompletedByOperator) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Operator has not marked tour as complete yet.",
                },
            });
        }

        // Check if already confirmed
        if (booking.tourConfirmedByCustomer) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Tour already confirmed.",
                },
            });
        }

        // Check if disputed
        if (booking.disputeReason) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Cannot confirm a disputed tour.",
                },
            });
        }

        // Confirm completion
        const updatedBooking = await db.quoteRequest.update({
            where: { id: quoteRequestId },
            data: {
                tourConfirmedByCustomer: true,
                tourConfirmedAt: new Date(),
                status: QuoteStatus.Completed, // NEW STATUS
            },
        });

        // TODO: Release payment to operator
        // TODO: Notify operator
        // TODO: Prompt customer to leave review

        revalidatePath("/bookings");
        revalidatePath(`/bookings/${quoteRequestId}`);

        return response({
            success: true,
            code: 200,
            data: { booking: updatedBooking },
        });
    } catch (error: any) {
        console.error("Error confirming tour:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to confirm tour completion.",
            },
        });
    }
};

// Dispute tour
export const disputeTour = async (quoteRequestId: string, reason: string) => {
    try {
        const user = await currentUser();

        if (!user) {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        if (!reason.trim()) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Dispute reason is required.",
                },
            });
        }

        // Verify booking belongs to user
        const booking = await db.quoteRequest.findFirst({
            where: {
                id: quoteRequestId,
                userId: user.id,
                status: QuoteStatus.Paid,
            },
        });

        if (!booking) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Booking not found.",
                },
            });
        }

        // Check if operator marked complete
        if (!booking.tourCompletedByOperator) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Cannot dispute before operator marks tour complete.",
                },
            });
        }

        // Check if already confirmed
        if (booking.tourConfirmedByCustomer) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Cannot dispute after confirming tour.",
                },
            });
        }

        // Check if already disputed
        if (booking.disputeReason) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Tour already disputed.",
                },
            });
        }

        // Create dispute
        const updatedBooking = await db.quoteRequest.update({
            where: { id: quoteRequestId },
            data: {
                disputeReason: reason,
                disputeCreatedAt: new Date(),
                status: QuoteStatus.Disputed, // NEW STATUS
            },
        });

        // TODO: Notify admin to review dispute
        // TODO: Notify operator

        revalidatePath("/bookings");
        revalidatePath(`/bookings/${quoteRequestId}`);

        return response({
            success: true,
            code: 200,
            data: { booking: updatedBooking },
        });
    } catch (error: any) {
        console.error("Error disputing tour:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to create dispute.",
            },
        });
    }
};
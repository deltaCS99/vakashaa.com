// actions/operator/bookings.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { QuoteStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Get operator's bookings (paid quotes)
export const getOperatorBookings = async (businessId?: string) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Operator") {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        const { getOperatorProfile } = await import("@/lib/operator");
        const operatorProfile = await getOperatorProfile(businessId);

        if (!operatorProfile) {
            return response({
                success: false,
                error: { code: 404, message: "Profile not found" },
            });
        }

        const bookings = await db.quoteRequest.findMany({
            where: {
                status: {
                    in: [QuoteStatus.Paid, QuoteStatus.Completed, QuoteStatus.Disputed],
                },
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
                    },
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        whatsappNumber: true,
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
export const getOperatorBookingById = async (bookingId: string) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Operator") {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        const { getOperatorProfile } = await import("@/lib/operator");
        const operatorProfile = await getOperatorProfile();

        if (!operatorProfile) {
            return response({
                success: false,
                error: { code: 404, message: "Profile not found" },
            });
        }

        const booking = await db.quoteRequest.findFirst({
            where: {
                id: bookingId,
                status: QuoteStatus.Paid,
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

// Mark tour as completed by operator
export const markTourComplete = async (quoteRequestId: string) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Operator") {
            return response({
                success: false,
                error: { code: 401, message: "Unauthorized" },
            });
        }

        // Verify booking belongs to operator
        const booking = await db.quoteRequest.findFirst({
            where: {
                id: quoteRequestId,
                status: QuoteStatus.Paid,
                tour: {
                    operatorProfile: {
                        userId: user.id,
                    },
                },
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

        // Check if tour end date has passed
        if (!booking.confirmedTourEndDate || new Date(booking.confirmedTourEndDate) > new Date()) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Cannot mark tour as complete before end date.",
                },
            });
        }

        // Check if already marked complete
        if (booking.tourCompletedByOperator) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Tour already marked as complete.",
                },
            });
        }

        // Mark as complete
        const updatedBooking = await db.quoteRequest.update({
            where: { id: quoteRequestId },
            data: {
                tourCompletedByOperator: true,
                tourCompletedAt: new Date(),
            },
        });

        // TODO: Send notification to customer to confirm

        revalidatePath("/operator/bookings");
        revalidatePath(`/operator/bookings/${quoteRequestId}`);

        return response({
            success: true,
            code: 200,
            data: { booking: updatedBooking },
        });
    } catch (error: any) {
        console.error("Error marking tour complete:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to mark tour as complete.",
            },
        });
    }
};
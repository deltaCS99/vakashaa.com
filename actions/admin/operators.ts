// actions/admin/operators.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { sendOperatorApprovedNotification, sendOperatorBankRejectedNotification, sendOperatorQualityControlMessage, sendOperatorRejectedNotification } from "@/lib/whatsapp";


// Get all operators with filters
export const getOperators = async (params?: {
    status?: "all" | "pending" | "approved" | "bank_pending";
    search?: string;
    page?: number;
    limit?: number;
}) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Admin") {
            return response({
                success: false,
                error: {
                    code: 403,
                    message: "Unauthorized. Admin access required.",
                },
            });
        }

        const { status = "all", search, page = 1, limit = 20 } = params || {};

        // Build where clause based on status
        const where: any = {};

        if (status === "pending") {
            // Submitted for review but not approved
            where.isApproved = false;
            where.verificationDocumentsSubmittedAt = { not: null };
        } else if (status === "approved") {
            // Approved with bank approved
            where.isApproved = true;
            where.bankVerificationStatus = "Approved";
        } else if (status === "bank_pending") {
            // Approved but bank pending
            where.isApproved = true;
            where.bankVerificationStatus = "Pending";
        }

        if (search) {
            where.OR = [
                { businessName: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
            ];
        }

        // Get total count
        const totalCount = await db.operatorProfile.count({ where });
        const totalPages = Math.ceil(totalCount / limit);

        // Get operators
        const operators = await db.operatorProfile.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        return response({
            success: true,
            code: 200,
            data: {
                operators,
                totalCount,
                totalPages,
                currentPage: page,
            },
        });
    } catch (error: any) {
        console.error("Error fetching operators:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch operators.",
            },
        });
    }
};

// Get single operator details
export const getOperatorById = async (operatorId: string) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Admin") {
            return response({
                success: false,
                error: {
                    code: 403,
                    message: "Unauthorized. Admin access required.",
                },
            });
        }

        const operator = await db.operatorProfile.findUnique({
            where: { id: operatorId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        createdAt: true,
                    },
                },
                tours: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        priceFrom: true,
                        currency: true,
                        isActive: true,
                        images: true,
                        createdAt: true,
                        _count: {
                            select: {
                                quoteRequests: true,
                            },
                        },
                        // Include quote requests through tours
                        quoteRequests: {
                            select: {
                                id: true,
                                reference: true,
                                status: true,
                                quotedPrice: true,
                                adults: true,
                                children: true,
                                preferredDate: true,
                                createdAt: true,
                                tour: {
                                    select: {
                                        id: true,
                                        title: true,
                                    },
                                },
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: "desc",
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });

        if (!operator) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Operator not found.",
                },
            });
        }

        // Flatten quote requests from all tours into a single array
        const quoteRequests = operator.tours.flatMap(tour => tour.quoteRequests);

        return response({
            success: true,
            code: 200,
            data: {
                operator: {
                    ...operator,
                    quoteRequests, // Add flattened quote requests
                }
            },
        });
    } catch (error: any) {
        console.error("Error fetching operator:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch operator details.",
            },
        });
    }
};

// Approve operator (initial approval - docs + bank together)
export const approveOperator = async (operatorId: string) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Admin") {
            return response({
                success: false,
                error: {
                    code: 403,
                    message: "Unauthorized. Admin access required.",
                },
            });
        }

        const operator = await db.operatorProfile.findUnique({
            where: { id: operatorId },
        });

        if (!operator) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Operator not found.",
                },
            });
        }

        if (operator.isApproved) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Operator is already approved.",
                },
            });
        }

        // Check all required documents
        if (
            !operator.companyRegistrationDocument ||
            !operator.idDocument ||
            !operator.serviceAgreement ||
            !operator.bankVerificationDocument
        ) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Operator has not submitted all required documents.",
                },
            });
        }

        // Approve everything at once
        const updatedOperator = await db.operatorProfile.update({
            where: { id: operatorId },
            data: {
                isApproved: true,
                bankVerificationStatus: "Approved",
                bankVerificationReviewedAt: new Date(),
                bankVerificationReviewedBy: user.id,
            },
        });

        await sendOperatorApprovedNotification({ operatorId });

        revalidatePath("/admin/operators");
        revalidatePath("/admin/dashboard");
        revalidatePath(`/admin/operators/${operatorId}`);

        return response({
            success: true,
            code: 200,
            data: {
                operator: updatedOperator,
                message: "Operator approved successfully.",
            },
        });
    } catch (error: any) {
        console.error("Error approving operator:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to approve operator.",
            },
        });
    }
};

export const getQuoteMessages = async (quoteRequestId: string) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Admin") {
            return response({
                success: false,
                error: {
                    code: 403,
                    message: "Unauthorized. Admin access required.",
                },
            });
        }

        const messages = await db.quoteMessage.findMany({
            where: { quoteRequestId },
            orderBy: {
                createdAt: "asc",
            },
        });

        return response({
            success: true,
            code: 200,
            data: { messages },
        });
    } catch (error: any) {
        console.error("Error fetching quote messages:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch messages.",
            },
        });
    }
};


// Reject operator (initial rejection)
export const rejectOperator = async (operatorId: string, reason: string) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Admin") {
            return response({
                success: false,
                error: {
                    code: 403,
                    message: "Unauthorized. Admin access required.",
                },
            });
        }

        const operator = await db.operatorProfile.findUnique({
            where: { id: operatorId },
        });

        if (!operator) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Operator not found.",
                },
            });
        }

        // Update operator status
        const updatedOperator = await db.operatorProfile.update({
            where: { id: operatorId },
            data: {
                isApproved: false,
                bankVerificationStatus: "Rejected",
                bankVerificationNotes: reason,
                bankVerificationReviewedAt: new Date(),
                bankVerificationReviewedBy: user.id,
            },
        });

        await sendOperatorRejectedNotification({ operatorId, reason });

        revalidatePath("/admin/operators");
        revalidatePath("/admin/dashboard");
        revalidatePath(`/admin/operators/${operatorId}`);

        return response({
            success: true,
            code: 200,
            data: {
                operator: updatedOperator,
                message: "Operator application rejected.",
            },
        });
    } catch (error: any) {
        console.error("Error rejecting operator:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to reject operator.",
            },
        });
    }
};

// Approve bank (re-verification after operator edits bank details)
export const approveBankDetails = async (operatorId: string) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Admin") {
            return response({
                success: false,
                error: {
                    code: 403,
                    message: "Unauthorized. Admin access required.",
                },
            });
        }

        const operator = await db.operatorProfile.findUnique({
            where: { id: operatorId },
        });

        if (!operator) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Operator not found.",
                },
            });
        }

        if (!operator.isApproved) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Operator must be approved first.",
                },
            });
        }

        const updatedOperator = await db.operatorProfile.update({
            where: { id: operatorId },
            data: {
                bankVerificationStatus: "Approved",
                bankVerificationReviewedAt: new Date(),
                bankVerificationReviewedBy: user.id,
                bankVerificationNotes: null, // Clear previous rejection notes
            },
        });

        // TODO: Send bank approval email

        revalidatePath("/admin/operators");
        revalidatePath("/admin/dashboard");
        revalidatePath(`/admin/operators/${operatorId}`);

        return response({
            success: true,
            code: 200,
            data: {
                operator: updatedOperator,
                message: "Bank details approved successfully.",
            },
        });
    } catch (error: any) {
        console.error("Error approving bank details:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to approve bank details.",
            },
        });
    }
};

// Reject bank (re-verification)
export const rejectBankDetails = async (operatorId: string, reason: string) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Admin") {
            return response({
                success: false,
                error: {
                    code: 403,
                    message: "Unauthorized. Admin access required.",
                },
            });
        }

        const operator = await db.operatorProfile.findUnique({
            where: { id: operatorId },
        });

        if (!operator) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Operator not found.",
                },
            });
        }

        if (!operator.isApproved) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Operator must be approved first.",
                },
            });
        }

        const updatedOperator = await db.operatorProfile.update({
            where: { id: operatorId },
            data: {
                bankVerificationStatus: "Rejected",
                bankVerificationNotes: reason,
                bankVerificationReviewedAt: new Date(),
                bankVerificationReviewedBy: user.id,
            },
        });

        await sendOperatorBankRejectedNotification({ operatorId, reason });

        revalidatePath("/admin/operators");
        revalidatePath("/admin/dashboard");
        revalidatePath(`/admin/operators/${operatorId}`);

        return response({
            success: true,
            code: 200,
            data: {
                operator: updatedOperator,
                message: "Bank details rejected.",
            },
        });
    } catch (error: any) {
        console.error("Error rejecting bank details:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to reject bank details.",
            },
        });
    }
};

export const sendOperatorWhatsApp = async (params: {
    operatorId: string;
    message: string;
    type: "quality_control" | "rejection" | "bank_rejection" | "approval" | "general";
}) => {
    try {
        const user = await currentUser();

        if (!user || user.role !== "Admin") {
            return response({
                success: false,
                error: {
                    code: 403,
                    message: "Unauthorized. Admin access required.",
                },
            });
        }

        let result;

        // Use appropriate template based on type
        if (params.type === "quality_control" || params.type === "general") {
            result = await sendOperatorQualityControlMessage({
                operatorId: params.operatorId,
                message: params.message,
            });
        } else if (params.type === "approval") {
            result = await sendOperatorApprovedNotification({
                operatorId: params.operatorId,
            });
        } else if (params.type === "rejection") {
            result = await sendOperatorRejectedNotification({
                operatorId: params.operatorId,
                reason: params.message,
            });
        } else if (params.type === "bank_rejection") {
            result = await sendOperatorBankRejectedNotification({
                operatorId: params.operatorId,
                reason: params.message,
            });
        }

        if (!result?.success) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: result?.error || "Failed to send WhatsApp message",
                },
            });
        }

        revalidatePath(`/admin/operators/${params.operatorId}`);

        return response({
            success: true,
            code: 200,
            data: {
                messageId: result.messageId,
                message: "WhatsApp notification sent successfully",
            },
        });
    } catch (error: any) {
        console.error("Error sending WhatsApp notification:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to send WhatsApp notification.",
            },
        });
    }
};
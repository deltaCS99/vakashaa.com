// actions/admin/operators.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { sendOperatorWhatsAppNotification, WHATSAPP_TEMPLATES } from "@/lib/whatsapp";


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
                        isActive: true,
                        createdAt: true,
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

        return response({
            success: true,
            code: 200,
            data: { operator },
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

        // TODO: Send approval email to operator

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

        // TODO: Send rejection email to operator with reason

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

        // TODO: Send bank rejection email

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

        // Send WhatsApp message via Twilio
        const result = await sendOperatorWhatsAppNotification({
            operatorId: params.operatorId,
            message: params.message,
            type: params.type,
        });

        if (!result.success) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: result.error || "Failed to send WhatsApp message",
                },
            });
        }

        // Log the notification (optional - for audit trail)
        // You could create a notifications table to track sent messages

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
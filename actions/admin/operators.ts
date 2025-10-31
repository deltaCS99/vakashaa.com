// actions/admin/operators.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// Get all operators with filters
export const getOperators = async (params?: {
    status?: "all" | "pending" | "approved" | "rejected";
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

        // Build where clause
        const where: any = {};

        if (status === "pending") {
            where.isApproved = false;
        } else if (status === "approved") {
            where.isApproved = true;
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
                _count: {
                    select: {
                        tours: true,
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

// Approve operator
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

        // Update operator status
        const updatedOperator = await db.operatorProfile.update({
            where: { id: operatorId },
            data: {
                isApproved: true,
            },
        });

        // TODO: Send approval email to operator

        revalidatePath("/admin/operators");
        revalidatePath("/admin/dashboard");

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

// Reject/Revoke operator
export const rejectOperator = async (operatorId: string) => {
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
            },
        });

        // TODO: Send rejection/revocation email to operator

        revalidatePath("/admin/operators");
        revalidatePath("/admin/dashboard");

        return response({
            success: true,
            code: 200,
            data: {
                operator: updatedOperator,
                message: operator.isApproved
                    ? "Operator approval revoked."
                    : "Operator rejected.",
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

// Update operator details
export const updateOperator = async (params: {
    operatorId: string;
    businessName?: string;
    businessPhone?: string | null;
    businessWhatsApp?: string | null;
    description?: string | null;
    operatorType?: "TourOperator" | "DMC";
    serviceType?: "Inbound" | "Domestic" | "Outbound" | "All";
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

        const operator = await db.operatorProfile.findUnique({
            where: { id: params.operatorId },
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

        // Update operator
        const updatedOperator = await db.operatorProfile.update({
            where: { id: params.operatorId },
            data: {
                businessName: params.businessName,
                businessPhone: params.businessPhone,
                businessWhatsApp: params.businessWhatsApp,
                description: params.description,
                operatorType: params.operatorType,
                serviceType: params.serviceType,
            },
        });

        revalidatePath("/admin/operators");
        revalidatePath(`/admin/operators/${params.operatorId}`);
        revalidatePath("/admin/dashboard");

        return response({
            success: true,
            code: 200,
            data: {
                operator: updatedOperator,
                message: "Operator updated successfully.",
            },
        });
    } catch (error: any) {
        console.error("Error updating operator:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to update operator.",
            },
        });
    }
};

// Delete operator (and associated data)
export const deleteOperator = async (operatorId: string) => {
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
                tours: true,
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

        // Check if operator has tours
        if (operator.tours.length > 0) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Cannot delete operator with existing tours. Please remove tours first.",
                },
            });
        }

        // Delete operator profile
        await db.operatorProfile.delete({
            where: { id: operatorId },
        });

        revalidatePath("/admin/operators");
        revalidatePath("/admin/dashboard");

        return response({
            success: true,
            code: 200,
            data: {
                message: "Operator deleted successfully.",
            },
        });
    } catch (error: any) {
        console.error("Error deleting operator:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to delete operator.",
            },
        });
    }
};
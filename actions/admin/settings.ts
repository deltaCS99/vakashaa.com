// actions/admin/settings.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// Get all settings
export const getAllSettings = async () => {
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

        const settings = await db.setting.findMany({
            orderBy: { updatedAt: "desc" },
        });

        return response({
            success: true,
            code: 200,
            data: { settings },
        });
    } catch (error: any) {
        console.error("Error fetching settings:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch settings.",
            },
        });
    }
};

// Create new setting
export const createSetting = async (params: { key: string; value: string }) => {
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

        if (!params.key.trim()) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Key is required.",
                },
            });
        }

        // Check if key already exists
        const existing = await db.setting.findUnique({
            where: { key: params.key },
        });

        if (existing) {
            return response({
                success: false,
                error: {
                    code: 400,
                    message: "Setting with this key already exists.",
                },
            });
        }

        const setting = await db.setting.create({
            data: {
                key: params.key,
                value: params.value,
            },
        });

        revalidatePath("/admin/settings");

        return response({
            success: true,
            code: 201,
            data: { setting },
        });
    } catch (error: any) {
        console.error("Error creating setting:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to create setting.",
            },
        });
    }
};

// Update setting
export const updateSetting = async (params: { key: string; value: string }) => {
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

        const setting = await db.setting.update({
            where: { key: params.key },
            data: { value: params.value },
        });

        revalidatePath("/admin/settings");

        return response({
            success: true,
            code: 200,
            data: { setting },
        });
    } catch (error: any) {
        console.error("Error updating setting:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to update setting.",
            },
        });
    }
};

// Delete setting
export const deleteSetting = async (key: string) => {
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

        await db.setting.delete({
            where: { key },
        });

        revalidatePath("/admin/settings");

        return response({
            success: true,
            code: 200,
            data: { message: "Setting deleted." },
        });
    } catch (error: any) {
        console.error("Error deleting setting:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to delete setting.",
            },
        });
    }
};
// actions/admin/dashboard.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";

export const getAdminDashboardStats = async () => {
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

    // Get urgent actions
    const [pendingOperators, pendingBankVerifications] = await Promise.all([
      db.operatorProfile.count({
        where: {
          isApproved: false,
          verificationDocumentsSubmittedAt: { not: null },
        },
      }),
      db.operatorProfile.count({
        where: {
          isApproved: true,
          bankVerificationStatus: "Pending",
        },
      }),
    ]);

    // Get this week's stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [newOperators, newTours, newQuotes, confirmedBookings] = await Promise.all([
      db.operatorProfile.count({
        where: {
          createdAt: { gte: weekAgo },
        },
      }),
      db.tour.count({
        where: {
          createdAt: { gte: weekAgo },
        },
      }),
      db.quoteRequest.count({
        where: {
          createdAt: { gte: weekAgo },
        },
      }),
      db.quoteRequest.count({
        where: {
          status: "Paid",
          createdAt: { gte: weekAgo },
        },
      }),
    ]);

    return response({
      success: true,
      code: 200,
      data: {
        urgentActions: {
          pendingOperators,
          pendingBankVerifications,
          total: pendingOperators + pendingBankVerifications,
        },
        weeklyStats: {
          newOperators,
          newTours,
          newQuotes,
          confirmedBookings,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin dashboard stats:", error);
    return response({
      success: false,
      error: {
        code: 500,
        message: "Failed to fetch dashboard statistics.",
      },
    });
  }
};

export const getRecentSignups = async () => {
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

    // Get signups from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentOperators = await db.operatorProfile.findMany({
      where: {
        createdAt: { gte: yesterday },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return response({
      success: true,
      code: 200,
      data: { operators: recentOperators },
    });
  } catch (error: any) {
    console.error("Error fetching recent signups:", error);
    return response({
      success: false,
      error: {
        code: 500,
        message: "Failed to fetch recent signups.",
      },
    });
  }
};
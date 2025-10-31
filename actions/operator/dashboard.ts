// actions/operator/dashboard.ts
"use server";

import { db } from "@/lib/db";
import { requireApprovedOperator } from "@/lib/operator";
import { response } from "@/lib/utils";
import { QuoteStatus } from "@prisma/client";

export const getOperatorDashboardStats = async () => {
  try {
    const operatorProfile = await requireApprovedOperator();

    // Get all tours for this operator
    const tours = await db.tour.findMany({
      where: {
        operatorProfileId: operatorProfile.id,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    // Get all quote requests for operator's tours
    const allQuotes = await db.quoteRequest.findMany({
      where: {
        tour: {
          operatorProfileId: operatorProfile.id,
        },
      },
      select: {
        id: true,
        status: true,
        quotedPrice: true,
        createdAt: true,
      },
    });

    // Calculate stats
    const totalTours = tours.length;
    const activeTours = tours.filter((t) => t.isActive).length;
    const inactiveTours = tours.filter((t) => !t.isActive).length;

    const totalQuotes = allQuotes.length;
    const pendingQuotes = allQuotes.filter((q) => q.status === QuoteStatus.Pending).length;
    const quotedQuotes = allQuotes.filter((q) => q.status === QuoteStatus.Quoted).length;
    const acceptedQuotes = allQuotes.filter((q) => q.status === QuoteStatus.Accepted).length;
    const confirmedBookings = allQuotes.filter((q) => q.status === QuoteStatus.Paid).length;

    // Calculate acceptance rate (accepted + paid / total quoted)
    const totalQuotedOrAccepted = allQuotes.filter((q) =>
      [QuoteStatus.Quoted, QuoteStatus.Accepted, QuoteStatus.Paid as QuoteStatus].includes(q.status)
    ).length;
    const totalAcceptedOrPaid = acceptedQuotes + confirmedBookings;
    const acceptanceRate =
      totalQuotedOrAccepted > 0
        ? Math.round((totalAcceptedOrPaid / totalQuotedOrAccepted) * 100)
        : 0;

    // Calculate total revenue (sum of paid quotes)
    const totalRevenue = allQuotes
      .filter((q) => q.status === QuoteStatus.Paid && q.quotedPrice)
      .reduce((sum, q) => sum + (q.quotedPrice || 0), 0);

    // Get recent quote requests (last 10)
    const recentQuotes = await db.quoteRequest.findMany({
      where: {
        tour: {
          operatorProfileId: operatorProfile.id,
        },
      },
      select: {
        id: true,
        reference: true,
        status: true,
        preferredDate: true,
        adults: true,
        children: true,
        quotedPrice: true,
        createdAt: true,
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return response({
      success: true,
      code: 200,
      data: {
        stats: {
          totalTours,
          activeTours,
          inactiveTours,
          totalQuotes,
          pendingQuotes,
          quotedQuotes,
          acceptedQuotes,
          confirmedBookings,
          acceptanceRate,
          totalRevenue,
        },
        recentQuotes,
      },
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return response({
      success: false,
      error: {
        code: 500,
        message: "Failed to load dashboard data.",
      },
    });
  }
};
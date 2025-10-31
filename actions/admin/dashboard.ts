// actions/admin/dashboard.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { QuoteStatus, BlogStatus } from "@prisma/client";

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

    // Get counts
    const [
      totalOperators,
      pendingOperators,
      approvedOperators,
      totalTours,
      activeTours,
      totalQuotes,
      pendingQuotes,
      totalUsers,
      totalBlogPosts,
      publishedBlogPosts,
    ] = await Promise.all([
      db.operatorProfile.count(),
      db.operatorProfile.count({ where: { isApproved: false } }),
      db.operatorProfile.count({ where: { isApproved: true } }),
      db.tour.count(),
      db.tour.count({ where: { isActive: true } }),
      db.quoteRequest.count(),
      db.quoteRequest.count({ where: { status: QuoteStatus.Pending } }),
      db.user.count({ where: { role: "User" } }),
      db.blogPost.count(),
      db.blogPost.count({ where: { status: BlogStatus.Published } }),
    ]);

    return response({
      success: true,
      code: 200,
      data: {
        operators: {
          total: totalOperators,
          pending: pendingOperators,
          approved: approvedOperators,
        },
        tours: {
          total: totalTours,
          active: activeTours,
        },
        quotes: {
          total: totalQuotes,
          pending: pendingQuotes,
        },
        users: {
          total: totalUsers,
        },
        blog: {
          total: totalBlogPosts,
          published: publishedBlogPosts,
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

export const getRecentActivity = async () => {
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

    // Get recent operators
    const recentOperators = await db.operatorProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get recent quotes
    const recentQuotes = await db.quoteRequest.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        tour: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get recent tours
    const recentTours = await db.tour.findMany({
      include: {
        operatorProfile: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get recent blog posts
    const recentBlogPosts = await db.blogPost.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
        publishedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return response({
      success: true,
      code: 200,
      data: {
        operators: recentOperators,
        quotes: recentQuotes,
        tours: recentTours,
        blogPosts: recentBlogPosts,
      },
    });
  } catch (error: any) {
    console.error("Error fetching recent activity:", error);
    return response({
      success: false,
      error: {
        code: 500,
        message: "Failed to fetch recent activity.",
      },
    });
  }
};
// actions/blog.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { BlogStatus } from "@prisma/client";

// Get published blog posts (public)
export const getPublishedBlogPosts = async (filters?: {
    category?: string;
    tag?: string;
    search?: string;
}) => {
    try {
        const where: any = {
            status: BlogStatus.Published,
        };

        if (filters?.category) {
            where.category = filters.category;
        }

        if (filters?.tag) {
            where.tags = { has: filters.tag };
        }

        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: "insensitive" } },
                { excerpt: { contains: filters.search, mode: "insensitive" } },
                { content: { contains: filters.search, mode: "insensitive" } },
            ];
        }

        const posts = await db.blogPost.findMany({
            where,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                featuredImage: true,
                category: true,
                tags: true,
                publishedAt: true,
                viewCount: true,
            },
            orderBy: {
                publishedAt: "desc",
            },
        });

        return response({
            success: true,
            code: 200,
            data: { posts },
        });
    } catch (error: any) {
        console.error("Error fetching blog posts:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch blog posts.",
            },
        });
    }
};

// Get single blog post by slug (public)
export const getBlogPostBySlug = async (slug: string) => {
    try {
        const post = await db.blogPost.findUnique({
            where: {
                slug,
                status: BlogStatus.Published,
            },
            include: {
                relatedTours: {
                    where: {
                        isActive: true,
                    },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        images: true,
                        priceFrom: true,
                        currency: true,
                        duration: true,
                        countries: true,
                    },
                },
            },
        });

        if (!post) {
            return response({
                success: false,
                error: {
                    code: 404,
                    message: "Blog post not found.",
                },
            });
        }

        // Increment view count
        await db.blogPost.update({
            where: { id: post.id },
            data: { viewCount: { increment: 1 } },
        });

        return response({
            success: true,
            code: 200,
            data: { post },
        });
    } catch (error: any) {
        console.error("Error fetching blog post:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch blog post.",
            },
        });
    }
};

// Get related posts
export const getRelatedBlogPosts = async (postId: string, category?: string | null, tags?: string[]) => {
    try {
        const where: any = {
            status: BlogStatus.Published,
            id: { not: postId },
        };

        if (category || (tags && tags.length > 0)) {
            where.OR = [];
            if (category) {
                where.OR.push({ category });
            }
            if (tags && tags.length > 0) {
                where.OR.push({ tags: { hasSome: tags } });
            }
        }

        const posts = await db.blogPost.findMany({
            where,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                featuredImage: true,
                category: true,
                publishedAt: true,
            },
            orderBy: {
                publishedAt: "desc",
            },
            take: 3,
        });

        return response({
            success: true,
            code: 200,
            data: { posts },
        });
    } catch (error: any) {
        console.error("Error fetching related posts:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch related posts.",
            },
        });
    }
};

// app/admin/blog/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BlogManagement } from "@/components/admin/blog-management";

export const metadata: Metadata = {
    title: "Blog Management | Admin",
    description: "Manage blog posts",
};

export default async function BlogPage() {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
        redirect("/");
    }

    const posts = await db.blogPost.findMany({
        include: {
            author: {
                select: {
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    relatedTours: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return <BlogManagement posts={posts} />;
}
// app/blog/page.tsx
import { Metadata } from "next";
import { getPublishedBlogPosts } from "@/actions/blog";
import { BlogList } from "@/components/blog/blog-list";
import { BlogHero } from "@/components/blog/blog-hero";
import { db } from "@/lib/db";
import { BlogStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Travel Blog | SA Tours",
  description: "Discover travel tips, destination guides, and inspiration for your South African adventure",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { category?: string; tag?: string; search?: string };
}) {
  const { category, tag, search } = searchParams;

  // Fetch posts using action
  const result = await getPublishedBlogPosts({
    category,
    tag,
    search,
  });

  if (!result.success || !("data" in result)) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <BlogHero />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-red-600">Failed to load blog posts</p>
          </div>
        </div>
      </div>
    );
  }

  const { posts } = result.data;

  // Get categories for filter
  const categories = await db.blogPost.findMany({
    where: { status: BlogStatus.Published },
    select: { category: true },
    distinct: ["category"],
  });

  const uniqueCategories = categories
    .map((c) => c.category)
    .filter((c): c is string => c !== null);

  // Get tags for filter
  const allTags = await db.blogPost.findMany({
    where: { status: BlogStatus.Published },
    select: { tags: true },
  });

  const uniqueTags = Array.from(
    new Set(allTags.flatMap((p) => p.tags))
  ).sort();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <BlogHero />
      
      <div className="container mx-auto px-4 py-12">
        <BlogList
          posts={posts}
          categories={uniqueCategories}
          tags={uniqueTags}
          currentCategory={category}
          currentTag={tag}
          currentSearch={search}
        />
      </div>
    </div>
  );
}
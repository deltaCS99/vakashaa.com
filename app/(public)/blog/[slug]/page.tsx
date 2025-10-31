// app/blog/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPostBySlug, getRelatedBlogPosts } from "@/actions/blog";
import { BlogPostContent } from "@/components/blog/blog-post-content";
import { BlogPostHeader } from "@/components/blog/blog-post-header";
import { RelatedTours } from "@/components/blog/related-tours";
import { RelatedPosts } from "@/components/blog/related-posts";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const result = await getBlogPostBySlug(params.slug);

  if (!result.success || !("data" in result)) {
    return {
      title: "Post Not Found | SA Tours",
    };
  }

  const { post } = result.data;

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: post.keywords,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const result = await getBlogPostBySlug(params.slug);

  if (!result.success || !("data" in result)) {
    notFound();
  }

  const { post } = result.data;

  // Get related posts
  const relatedResult = await getRelatedBlogPosts(
    post.id,
    post.category,
    post.tags
  );

  const relatedPosts =
    relatedResult.success && "data" in relatedResult ? relatedResult.data.posts : [];

  return (
    <div className="min-h-screen bg-white">
      <BlogPostHeader post={post} />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <BlogPostContent post={post} />

          {/* Related Tours */}
          {post.relatedTours.length > 0 && (
            <div className="mt-16 pt-16 border-t">
              <RelatedTours tours={post.relatedTours} />
            </div>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-16 border-t">
              <RelatedPosts posts={relatedPosts} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
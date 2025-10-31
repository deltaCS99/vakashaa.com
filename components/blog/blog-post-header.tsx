// components/blog/blog-post-header.tsx
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Eye } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
interface BlogPostHeaderProps {
    post: {
        title: string;
        excerpt: string;
        featuredImage: string | null;
        category: string | null;
        tags: string[];
        publishedAt: Date | null;
        viewCount: number;
    };
}

export function BlogPostHeader({ post }: BlogPostHeaderProps) {
    const defaultImage =
        "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=1200&h=600&fit=crop";

    return (
        <div className="relative">
            {/* Featured Image */}
            <div className="relative h-[400px] bg-gray-200">
                <Image
                    src={post.featuredImage || defaultImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Category Badge */}
                {post.category && (
                    <Badge className="absolute top-6 left-6 text-base">{post.category}</Badge>
                )}
            </div>

            {/* Content */}
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto -mt-32 relative z-10">
                    <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
                        <p className="text-lg text-gray-600 mb-6">{post.excerpt}</p>

                        {/* Meta */}
                        <div className="flex items-center gap-6 text-sm text-gray-600 pb-6 border-b">
                            {post.publishedAt && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{format(new Date(post.publishedAt), "MMMM d, yyyy")}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{post.viewCount} views</span>
                            </div>
                        </div>

                        {/* Tags */}
                        {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-6">
                                {post.tags.map((tag) => (
                                    <Badge key={tag} variant="outline">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
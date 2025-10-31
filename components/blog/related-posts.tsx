// components/blog/related-posts.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

interface RelatedPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImage: string | null;
    category: string | null;
    publishedAt: Date | null;
}

interface RelatedPostsProps {
    posts: RelatedPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
    const defaultImage =
        "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=400&h=300&fit=crop";

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
                {posts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full">
                            <div className="relative h-48 bg-gray-200">
                                <Image
                                    src={post.featuredImage || defaultImage}
                                    alt={post.title}
                                    fill
                                    className="object-cover"
                                />
                                {post.category && (
                                    <Badge className="absolute top-2 left-2">{post.category}</Badge>
                                )}
                            </div>

                            <CardContent className="p-4 space-y-3">
                                <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                                <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>

                                <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                                    {post.publishedAt && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{format(new Date(post.publishedAt), "MMM d")}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
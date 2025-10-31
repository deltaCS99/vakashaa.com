// components/admin/blog-management.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, X, MoreHorizontal, Eye, Pencil, Trash2, FileText, Sparkles, Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { deleteBlogPost, toggleBlogPostStatus } from "@/actions/admin/blog";
import { toast } from "sonner";
import { BlogGeneratorDialog } from "./blog-generator-dialog";
import { BlogReviewDialog } from "./blog-review-dialog";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImage: string | null;
    status: string;
    publishedAt: Date | null;
    createdAt: Date;
    author: {
        name: string | null;
        email: string | null;
    };
    _count: {
        relatedTours: number;
    };
}

interface BlogManagementProps {
    posts: BlogPost[];
}

export function BlogManagement({ posts: initialPosts }: BlogManagementProps) {
    const router = useRouter();
    const [posts, setPosts] = useState(initialPosts);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<"all" | "draft" | "published" | "archived">("all");
    const [showGenerateDialog, setShowGenerateDialog] = useState(false);
    const [generatedBlog, setGeneratedBlog] = useState<any>(null);
    const [editPost, setEditPost] = useState<BlogPost | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleGenerated = (blog: any) => {
        setShowGenerateDialog(false);
        setGeneratedBlog(blog);
    };

    const handleBlogSaved = () => {
        setGeneratedBlog(null);
        setEditPost(null);
        router.refresh();
    };

    const handleToggleStatus = async (postId: string) => {
        setActionLoading(postId);
        const result = await toggleBlogPostStatus(postId);
        setActionLoading(null);

        if (result.success) {
            toast.success("Post status updated");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to update post");
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        setActionLoading(postId);
        const result = await deleteBlogPost(postId);
        setActionLoading(null);

        if (result.success) {
            toast.success("Post deleted successfully");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to delete post");
        }
    };

    const filteredPosts = posts.filter((post) => {
        const matchesStatus =
            status === "all" ||
            (status === "draft" && post.status === "Draft") ||
            (status === "published" && post.status === "Published") ||
            (status === "archived" && post.status === "Archived");

        const matchesSearch =
            !search ||
            post.title.toLowerCase().includes(search.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(search.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
                        <p className="text-gray-600 mt-2">Create and manage blog posts</p>
                    </div>
                    <Button onClick={() => setShowGenerateDialog(true)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate with AI
                    </Button>
                </div>

                {/* Filters */}
                <div className="space-y-4 mb-6">
                    <Tabs value={status} onValueChange={(v: any) => setStatus(v)}>
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="draft">Draft</TabsTrigger>
                            <TabsTrigger value="published">Published</TabsTrigger>
                            <TabsTrigger value="archived">Archived</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by title or excerpt..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {(search || status !== "all") && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearch("");
                                    setStatus("all");
                                }}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Posts Grid */}
                {filteredPosts.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-4">No blog posts found</p>
                            <Button onClick={() => setShowGenerateDialog(true)}>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate your first post
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredPosts.map((post) => (
                            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                {post.featuredImage && (
                                    <div className="aspect-video bg-gray-200 overflow-hidden">
                                        <img
                                            src={post.featuredImage}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge
                                            variant={
                                                post.status === "Published"
                                                    ? "default"
                                                    : post.status === "Draft"
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                        >
                                            {post.status}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={actionLoading === post.id}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/blog/${post.slug}`} target="_blank">
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Post
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditPost(post)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(post.id)}>
                                                    {post.status === "Published" ? "Unpublish" : "Publish"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(post.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                        {post.excerpt}
                                    </p>

                                    <div className="text-xs text-muted-foreground">
                                        {post.publishedAt ? (
                                            <p>Published {format(new Date(post.publishedAt), "PPP")}</p>
                                        ) : (
                                            <p>Created {format(new Date(post.createdAt), "PPP")}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Generate Dialog */}
            <BlogGeneratorDialog
                open={showGenerateDialog}
                onOpenChange={setShowGenerateDialog}
                onGenerated={handleGenerated}
            />

            {/* Review Dialog (for newly generated) */}
            {generatedBlog && (
                <BlogReviewDialog
                    open={!!generatedBlog}
                    onOpenChange={(open) => !open && setGeneratedBlog(null)}
                    blogData={generatedBlog}
                    onSaved={handleBlogSaved}
                />
            )}

            {/* Edit Dialog (for existing) */}
            {editPost && (
                <BlogReviewDialog
                    open={!!editPost}
                    onOpenChange={(open) => !open && setEditPost(null)}
                    existingPost={editPost}
                    onSaved={handleBlogSaved}
                />
            )}
        </div>
    );
}
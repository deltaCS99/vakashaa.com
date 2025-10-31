// components/admin/blog-review-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePlus, X, Loader2, Save } from "lucide-react";
import { createBlogPost, updateBlogPost } from "@/actions/admin/blog";
import { uploadBlogImage } from "@/lib/upload";
import { toast } from "sonner";

interface BlogReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    blogData?: any; // Generated blog
    existingPost?: any; // Existing post to edit
    onSaved: () => void;
}

export function BlogReviewDialog({
    open,
    onOpenChange,
    blogData,
    existingPost,
    onSaved,
}: BlogReviewDialogProps) {
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [activeTab, setActiveTab] = useState("content");

    // Form state
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [keywords, setKeywords] = useState<string[]>([]);
    const [featuredImage, setFeaturedImage] = useState("");
    const [imageSuggestion, setImageSuggestion] = useState<any>(null);
    const [relatedTourIds, setRelatedTourIds] = useState<string[]>([]);

    useEffect(() => {
        if (blogData) {
            // New generated blog
            setTitle(blogData.title || "");
            setSlug(blogData.slug || "");
            setExcerpt(blogData.excerpt || "");
            setContent(blogData.content || "");
            setMetaTitle(blogData.metaTitle || "");
            setMetaDescription(blogData.metaDescription || "");
            setKeywords(blogData.keywords || []);
            setRelatedTourIds(blogData.relatedTourIds || []);
            setFeaturedImage("");
            setImageSuggestion(blogData.featuredImageSuggestion || null);
        } else if (existingPost) {
            // Editing existing post
            setTitle(existingPost.title);
            setSlug(existingPost.slug);
            setExcerpt(existingPost.excerpt);
            setContent(existingPost.content);
            setMetaTitle(existingPost.metaTitle || "");
            setMetaDescription(existingPost.metaDescription || "");
            setKeywords(existingPost.keywords || []);
            setFeaturedImage(existingPost.featuredImage || "");
            setRelatedTourIds([]);
            setImageSuggestion(null);
        }
    }, [blogData, existingPost]);

    const handleImageUpload = async (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image too large. Max 5MB");
            return;
        }

        setUploadingImage(true);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                const base64Data = base64.split(",")[1];

                const result = await uploadBlogImage({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64Data,
                });

                if (result.success && result.url) {
                    setFeaturedImage(result.url);
                    toast.success("Featured image uploaded");
                } else {
                    toast.error(result.error || "Upload failed");
                }
                setUploadingImage(false);
            };
        } catch (error) {
            toast.error("Upload failed");
            setUploadingImage(false);
        }
    };

    const handleSaveAsDraft = async () => {
        if (!title || !slug || !excerpt || !content) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);

        const result = existingPost
            ? await updateBlogPost({
                postId: existingPost.id,
                title,
                slug,
                excerpt,
                content,
                featuredImage: featuredImage || undefined,
                metaTitle,
                metaDescription,
                keywords,
                status: "Draft",
            })
            : await createBlogPost({
                title,
                slug,
                excerpt,
                content,
                featuredImage: featuredImage || undefined,
                metaTitle,
                metaDescription,
                keywords,
                status: "Draft",
                relatedTourIds,
            });

        setLoading(false);

        if (result.success) {
            toast.success("Saved as draft");
            onSaved();
        } else {
            toast.error(result.error?.message || "Failed to save");
        }
    };

    const handlePublish = async () => {
        if (!title || !slug || !excerpt || !content) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);

        const result = existingPost
            ? await updateBlogPost({
                postId: existingPost.id,
                title,
                slug,
                excerpt,
                content,
                featuredImage: featuredImage || undefined,
                metaTitle,
                metaDescription,
                keywords,
                status: "Published",
                publishedAt: new Date(),
            })
            : await createBlogPost({
                title,
                slug,
                excerpt,
                content,
                featuredImage: featuredImage || undefined,
                metaTitle,
                metaDescription,
                keywords,
                status: "Published",
                publishedAt: new Date(),
                relatedTourIds,
            });

        setLoading(false);

        if (result.success) {
            toast.success("Published successfully!");
            onSaved();
        } else {
            toast.error(result.error?.message || "Failed to publish");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{existingPost ? "Edit Blog Post" : "Review & Publish"}</DialogTitle>
                    <DialogDescription>
                        {existingPost
                            ? "Update your blog post"
                            : "Review the AI-generated content and publish"}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="seo">SEO</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>

                    {/* Content Tab */}
                    <TabsContent value="content" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Slug *</Label>
                            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
                            <p className="text-xs text-muted-foreground">URL: /blog/{slug}</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Excerpt *</Label>
                            <Textarea
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                rows={3}
                                placeholder="Brief description shown in blog listings"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Content (HTML) *</Label>
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={15}
                                className="font-mono text-sm"
                                placeholder="HTML content..."
                            />
                            <p className="text-xs text-muted-foreground">
                                HTML content - you can edit if needed
                            </p>
                        </div>
                    </TabsContent>

                    {/* SEO Tab */}
                    <TabsContent value="seo" className="space-y-4">
                        {/* Featured Image */}
                        <div className="space-y-2">
                            <Label>Featured Image</Label>

                            {/* AI Suggestion */}
                            {imageSuggestion && !featuredImage && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                                    <p className="text-sm font-medium text-blue-900 mb-1">
                                        AI Suggestion:
                                    </p>
                                    <p className="text-sm text-blue-700 mb-2">
                                        {imageSuggestion.description}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        Search on Unsplash/Pexels: &quot;{imageSuggestion.searchQuery}&quot;
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Alt text: {imageSuggestion.altText}
                                    </p>
                                </div>
                            )}

                            {featuredImage ? (
                                <div className="relative">
                                    <img
                                        src={featuredImage}
                                        alt="Featured"
                                        className="w-full h-64 object-cover rounded-lg"
                                    />
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="absolute top-2 right-2"
                                        onClick={() => setFeaturedImage("")}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <label className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                e.target.files?.[0] && handleImageUpload(e.target.files[0])
                                            }
                                            className="hidden"
                                            disabled={uploadingImage}
                                        />
                                        {uploadingImage ? (
                                            <>
                                                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
                                                <span className="text-sm text-gray-600">Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                                                <span className="text-sm text-gray-600">Upload Featured Image</span>
                                                <span className="text-xs text-gray-400 mt-1">Max 5MB • JPG, PNG, WebP</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Meta Title</Label>
                            <Input
                                value={metaTitle}
                                onChange={(e) => setMetaTitle(e.target.value)}
                                maxLength={60}
                                placeholder="SEO title for search engines"
                            />
                            <p className="text-xs text-muted-foreground">{metaTitle.length}/60 characters</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Meta Description</Label>
                            <Textarea
                                value={metaDescription}
                                onChange={(e) => setMetaDescription(e.target.value)}
                                rows={3}
                                maxLength={160}
                                placeholder="SEO description for search engines"
                            />
                            <p className="text-xs text-muted-foreground">
                                {metaDescription.length}/160 characters
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Keywords</Label>
                            <div className="flex flex-wrap gap-2">
                                {keywords.map((kw) => (
                                    <Badge key={kw} variant="secondary">
                                        {kw}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Preview Tab */}
                    <TabsContent value="preview">
                        <div className="bg-white rounded-lg border">
                            {/* Blog Header */}
                            <div className="relative h-64 bg-gray-200 rounded-t-lg overflow-hidden">
                                {featuredImage ? (
                                    <img
                                        src={featuredImage}
                                        alt="Featured"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        No featured image
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                                    <div className="p-6 text-white">
                                        <h1 className="text-3xl font-bold mb-2">{title || "Blog Title"}</h1>
                                        <p className="text-lg opacity-90">{excerpt || "Blog excerpt..."}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Blog Content */}
                            <div className="p-6">
                                <div
                                    className="prose prose-lg max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900
                    prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                    prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                    prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-ul:my-4 prose-ol:my-4
                    prose-li:text-gray-700 prose-li:my-1
                    prose-img:rounded-lg prose-img:shadow-md prose-img:my-6
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-600 
                    prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600"
                                    dangerouslySetInnerHTML={{ __html: content || "<p>No content yet...</p>" }}
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="outline" onClick={handleSaveAsDraft} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                    </Button>
                    <Button onClick={handlePublish} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Publishing...
                            </>
                        ) : (
                            "Publish"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
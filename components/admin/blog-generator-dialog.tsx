// components/admin/blog-generator-dialog.tsx
"use client";

import { useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, X } from "lucide-react";
import { generateBlogPost } from "@/actions/admin/blog";
import { toast } from "sonner";

interface BlogGeneratorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerated: (blog: any) => void;
}

export function BlogGeneratorDialog({
    open,
    onOpenChange,
    onGenerated,
}: BlogGeneratorDialogProps) {
    const [loading, setLoading] = useState(false);
    const [topic, setTopic] = useState("");
    const [keywords, setKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState("");
    const [tone, setTone] = useState<"professional" | "casual" | "luxury" | "adventurous">(
        "professional"
    );
    const [length, setLength] = useState<"short" | "medium" | "long">("medium");
    const [targetAudience, setTargetAudience] = useState("");

    const addKeyword = () => {
        if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
            setKeywords([...keywords, keywordInput.trim()]);
            setKeywordInput("");
        }
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            toast.error("Please enter a topic");
            return;
        }

        setLoading(true);

        try {
            const result = await generateBlogPost({
                topic: topic.trim(),
                keywords,
                tone,
                length,
                targetAudience: targetAudience.trim() || undefined,
            });

            if (result.success && "data" in result) {
                toast.success("Blog generated! Add images and publish");
                onGenerated(result.data.blogData);

                // Reset form
                setTopic("");
                setKeywords([]);
                setTone("professional");
                setLength("medium");
                setTargetAudience("");
            } else if (!result.success) {
                toast.error(result.error?.message || "Failed to generate blog post");
            } else {
                toast.error("Unexpected response from server");
            }

        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Generate Blog with AI
                    </DialogTitle>
                    <DialogDescription>
                        Tell AI what to write about. It will research and create a complete SEO-optimized
                        blog post in 30-60 seconds.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Topic */}
                    <div className="space-y-2">
                        <Label htmlFor="topic">Topic *</Label>
                        <Input
                            id="topic"
                            placeholder="e.g., Best Safari Parks in Kruger"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {/* Keywords */}
                    <div className="space-y-2">
                        <Label>Keywords (Optional)</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g., safari, wildlife"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                                disabled={loading}
                            />
                            <Button type="button" onClick={addKeyword} disabled={loading} variant="outline" size="sm">
                                Add
                            </Button>
                        </div>
                        {keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {keywords.map((kw) => (
                                    <Badge key={kw} variant="secondary">
                                        {kw}
                                        <button onClick={() => setKeywords(keywords.filter((k) => k !== kw))}>
                                            <X className="h-3 w-3 ml-1" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tone & Length */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tone</Label>
                            <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="casual">Casual</SelectItem>
                                    <SelectItem value="luxury">Luxury</SelectItem>
                                    <SelectItem value="adventurous">Adventurous</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Length</Label>
                            <Select value={length} onValueChange={(v: any) => setLength(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="short">Short (~500 words)</SelectItem>
                                    <SelectItem value="medium">Medium (~1000 words)</SelectItem>
                                    <SelectItem value="long">Long (~2000 words)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Target Audience */}
                    <div className="space-y-2">
                        <Label htmlFor="audience">Target Audience (Optional)</Label>
                        <Input
                            id="audience"
                            placeholder="e.g., Families, Solo travelers, Luxury travelers, Backpackers"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Who is this blog post written for?
                        </p>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !topic.trim()}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating... (30-60 seconds)
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Blog Post
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
// components/blog/blog-list.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Calendar, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: string | null;
  tags: string[];
  publishedAt: Date | null;
  viewCount: number;
}

interface BlogListProps {
  posts: BlogPost[];
  categories: string[];
  tags: string[];
  currentCategory?: string;
  currentTag?: string;
  currentSearch?: string;
}

export function BlogList({
  posts,
  categories,
  tags,
  currentCategory,
  currentTag,
  currentSearch,
}: BlogListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(currentSearch || "");
  const [isLoading, setIsLoading] = useState(false);

  const pushParams = (params: URLSearchParams) => {
    const query = params.toString();
    router.push(query ? `/blog?${query}` : "/blog");
  };

  useEffect(() => {
    setSearchQuery(currentSearch || "");
  }, [currentSearch]);

  useEffect(() => {
    setIsLoading(false);
  }, [posts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    searchQuery ? params.set("search", searchQuery) : params.delete("search");
    setIsLoading(true);
    pushParams(params);
  };

  const handleCategoryFilter = (category?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!category || params.get("category") === category) {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    setIsLoading(true);
    pushParams(params);
  };

  const handleTagFilter = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("tag") === tag) {
      params.delete("tag");
    } else {
      params.set("tag", tag);
    }
    setIsLoading(true);
    pushParams(params);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setIsLoading(true);
    router.push("/blog");
  };

  const hasFilters = Boolean(currentCategory || currentTag || currentSearch);

  const defaultImage =
    "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=800&h=600&fit=crop";

  const renderSkeletonCards = () => (
    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className="h-full border border-gray-100 shadow-sm">
          <div className="relative aspect-[16/10] bg-muted animate-pulse" />
          <CardContent className="space-y-4 p-6">
            <div className="flex gap-2">
              <div className="h-3 w-24 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-16 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-2/3 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-5/6 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-4/6 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
              <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <section id="all-posts" className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary/80">All blogs</p>
          <h2 className="text-3xl font-semibold text-gray-900">Latest articles & field stories</h2>
          <p className="text-muted-foreground">
            Practical tips from planners and guides on the ground. Pick a category or search to dive deeper.
          </p>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search blog posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-10 text-base"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Categories:</span>
          <button
            onClick={() => handleCategoryFilter("")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
              !currentCategory
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "bg-white hover:-translate-y-0.5 hover:border-gray-300"
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryFilter(category)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                currentCategory === category
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "bg-white hover:-translate-y-0.5 hover:border-gray-300"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-1">Tags:</span>
            {tags.map((tag) => (
              <button key={tag} onClick={() => handleTagFilter(tag)} className="focus:outline-none">
                <Badge
                  variant={currentTag === tag ? "default" : "outline"}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    currentTag === tag ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  )}
                >
                  {tag}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Active:</span>
          {currentCategory && <Badge variant="secondary">Category: {currentCategory}</Badge>}
          {currentTag && <Badge variant="secondary">Tag: {currentTag}</Badge>}
          {currentSearch && <Badge variant="secondary">Search: {currentSearch}</Badge>}
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary/80"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        </div>
      )}

      {isLoading ? (
        renderSkeletonCards()
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-700 font-semibold">No blog posts found.</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different category or clear your filters.</p>
          {hasFilters && (
            <Button variant="link" onClick={clearFilters} className="mt-3">
              Reset filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block h-full">
              <Card className="h-full overflow-hidden border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                <div className="relative aspect-[16/10] bg-muted">
                  <Image
                    src={post.featuredImage || defaultImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                    {post.category && (
                      <span className="text-primary font-semibold uppercase tracking-wide">{post.category}</span>
                    )}
                    {post.publishedAt && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(post.publishedAt), "dd MMM, yyyy")}</span>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-gray-900 leading-snug group-hover:text-primary">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {post.excerpt}
                      <span className="font-semibold text-primary">...Read more</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.length > 0 ? (
                        post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Untagged</span>
                      )}
                    </div>
                    <span className="text-primary font-semibold">Read article</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

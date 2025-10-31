// components/blog/blog-list.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Eye, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    params.delete("category");
    params.delete("tag");
    router.push(`/blog?${params.toString()}`);
  };

  const handleCategoryFilter = (category: string) => {
    const params = new URLSearchParams();
    params.set("category", category);
    router.push(`/blog?${params.toString()}`);
  };

  const handleTagFilter = (tag: string) => {
    const params = new URLSearchParams();
    params.set("tag", tag);
    router.push(`/blog?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/blog");
  };

  const hasFilters = currentCategory || currentTag || currentSearch;

  const defaultImage =
    "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=800&h=600&fit=crop";

  return (
    <div className="space-y-8">
      {/* Search */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
      </form>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Filters:</span>
          {currentCategory && (
            <Badge variant="secondary" className="gap-1">
              Category: {currentCategory}
              <button onClick={clearFilters} className="ml-1 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {currentTag && (
            <Badge variant="secondary" className="gap-1">
              Tag: {currentTag}
              <button onClick={clearFilters} className="ml-1 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {currentSearch && (
            <Badge variant="secondary" className="gap-1">
              Search: {currentSearch}
              <button onClick={clearFilters} className="ml-1 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Categories */}
          {categories.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryFilter(category)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentCategory === category
                          ? "bg-primary text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={currentTag === tag ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagFilter(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Posts Grid */}
        <div className="lg:col-span-3">
          {posts.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-600">No blog posts found.</p>
              {hasFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
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
                        <Badge className="absolute top-3 left-3">{post.category}</Badge>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                        {post.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(post.publishedAt), "MMM d, yyyy")}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          <Eye className="w-3 h-3" />
                          <span>{post.viewCount}</span>
                        </div>
                      </div>

                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
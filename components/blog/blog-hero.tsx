// components/blog/blog-hero.tsx
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type FeaturedPost = {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: string | null;
  publishedAt: Date | string | null;
  tags?: string[];
};

export function BlogHero({ featuredPost }: { featuredPost?: FeaturedPost | null }) {
  const fallbackImage = "/pexels-taryn-elliott-3889929.jpg";
  const publishedLabel =
    featuredPost?.publishedAt != null
      ? format(new Date(featuredPost.publishedAt), "MMM d, yyyy")
      : null;

  return (
    <section className="pb-12">
      <div className="relative overflow-hidden rounded-none bg-slate-900 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/pexels-pixabay-59989.jpg')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/35" />
        </div>

        <div className="relative container flex flex-col items-start justify-start gap-12 py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col justify-between gap-8 lg:max-w-2xl">
            <div className="flex flex-col gap-6">
              <nav aria-label="breadcrumb" className="text-sm text-white/80 flex items-center gap-2 flex-wrap">
                <Link href="/" className="hover:text-white transition-colors">
                  Resources
                </Link>
                <span className="h-1 w-1 rounded-full bg-white/50" />
                <span className="font-semibold text-white">Blog</span>
              </nav>

              <div className="flex flex-col gap-4">
                <h1 className="text-4xl md:text-5xl font-semibold leading-tight drop-shadow-lg">
                  Travel stories & guides
                </h1>
                <p className="text-lg text-white/85 max-w-2xl drop-shadow-sm">
                  The latest field notes, planning tips, and destination breakdowns from the team that actually
                  scouts these routes.
                </p>
              </div>
            </div>

          </div>

          <div className="w-full max-w-sm md:max-w-md lg:max-w-md lg:mt-6">
            {featuredPost ? (
              <Card className="overflow-hidden border border-white/30 bg-white shadow-sm">
                <div className="relative aspect-[3/2] bg-gray-100">
                  <Image
                    src={featuredPost.featuredImage || fallbackImage}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition duration-500"
                    sizes="(max-width: 1024px) 100vw, 400px"
                    priority
                  />
                </div>

                <CardContent className="space-y-4 p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span className="text-primary uppercase tracking-wide">
                      {featuredPost.category || "Travel insight"}
                    </span>
                    {publishedLabel && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="inline-flex items-center gap-1">
                          <Newspaper className="h-3.5 w-3.5" />
                          <span>{publishedLabel}</span>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold leading-tight text-gray-900">
                      {featuredPost.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                      {featuredPost.excerpt}
                      <span className="font-semibold text-primary">...Read more</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {featuredPost.tags?.length ? (
                        featuredPost.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="rounded-full px-3 py-1 text-[11px]">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span>Untagged</span>
                      )}
                    </div>
                    <Button variant="ghost" className="px-0 text-primary group" asChild>
                      <Link href={`/blog/${featuredPost.slug}`} className="inline-flex items-center gap-2">
                        Read article
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-muted-foreground/30 bg-white/70">
                <CardContent className="p-6 space-y-3 text-muted-foreground">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Newspaper className="h-4 w-4" />
                    Featured story
                  </div>
                  <p className="text-foreground text-lg font-semibold">No posts yet.</p>
                  <p className="text-sm">
                    Publish your first article to highlight it for readers. We will feature the most recent post here
                    automatically.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

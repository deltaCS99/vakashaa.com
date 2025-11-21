import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"

type BlogTeaserPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImage: string | null
  category: string | null
  publishedAt: Date | string | null
}

interface BlogTeaserProps {
  posts: BlogTeaserPost[]
}

export function BlogTeaser({ posts }: BlogTeaserProps) {
  if (!posts.length) return null

  const fallbackImage = "/pexels-pixabay-59989.jpg"

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">From the blog</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Travel tips and stories</h2>
          <p className="text-gray-600">Fresh guides and inspiration from across Africa.</p>
        </div>
        <Link
          href="/blog"
          className="hidden sm:inline-flex text-sm font-semibold text-amber-700 hover:text-amber-800"
        >
          View all posts →
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => {
          const publishedLabel = post.publishedAt
            ? format(new Date(post.publishedAt), "MMM d, yyyy")
            : "Recently posted"

          return (
            <Link key={post.id} href={`/blog/${post.slug}`} className="h-full">
              <Card className="group h-full overflow-hidden border-gray-100 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="relative h-44 bg-gray-100">
                  <Image
                    src={post.featuredImage || fallbackImage}
                    alt={post.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                  />
                  {post.category && (
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-amber-700 shadow">
                      {post.category}
                    </span>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="text-xs text-gray-500">{publishedLabel}</div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-amber-700">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <Link
        href="/blog"
        className="sm:hidden inline-flex text-sm font-semibold text-amber-700 hover:text-amber-800"
      >
        View all posts →
      </Link>
    </section>
  )
}

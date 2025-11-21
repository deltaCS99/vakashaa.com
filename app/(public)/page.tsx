// app/(public)/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { getTours } from "@/actions/tours";
import { getPublishedBlogPosts } from "@/actions/blog";
import { TourFilters } from "@/components/tours/tour-filters";
import { TourGrid } from "@/components/tours/tour-grid";
import { TourGridSkeleton } from "@/components/tours/tour-grid-skeleton";
import { HeroSection } from "@/components/home/hero-section";
import { BlogTeaser } from "@/components/blog/blog-teaser";

export const metadata: Metadata = {
  title: "Browse Tours - Discover South Africa",
  description: "Find and book amazing tours across South Africa. From wildlife safaris to city tours, discover your perfect adventure with verified local operators.",
  keywords: ["South Africa tours", "domestic tours", "safari", "Cape Town tours", "Kruger tours"],
};

interface HomePageProps {
  searchParams: {
    localDestination?: string;
    country?: string;
    scope?: "local" | "international";
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    page?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Show hero only if no filters are active
  const hasFilters = Object.keys(searchParams).length > 0;

  const blogResult = await getPublishedBlogPosts();
  const blogPosts =
    blogResult.success && "data" in blogResult
      ? blogResult.data.posts.slice(0, 3)
      : [];

  const heading =
    searchParams.search
      ? `Search results for "${searchParams.search}"`
      : searchParams.localDestination
        ? `Tours in ${searchParams.localDestination}`
        : searchParams.country
          ? `Tours in ${searchParams.country}`
          : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Only show when no filters */}
      {!hasFilters && (
        <HeroSection />
      )}

      {/* Filters Section - in-body */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-4">
          <TourFilters defaultValues={searchParams} />
        </div>
      </section>

      {/* Tours Grid */}
      <section className="container mx-auto px-4 py-8">
        {heading && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
          </div>
        )}

        <Suspense fallback={<TourGridSkeleton />}>
          <ToursContent searchParams={searchParams} />
        </Suspense>
      </section>

      {blogPosts.length > 0 && (
        <section className="bg-gray-50/80 border-t">
          <div className="container mx-auto px-4 py-12">
            <BlogTeaser posts={blogPosts} />
          </div>
        </section>
      )}
    </div>
  );
}

async function ToursContent({ searchParams }: { searchParams: HomePageProps['searchParams'] }) {
  const result = await getTours({
    localDestination: searchParams.localDestination,
    country: searchParams.country,
    scope: searchParams.scope,
    category: searchParams.category,
    minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined,
    search: searchParams.search,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  });

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load tours. Please try again later.</p>
      </div>
    );
  }

  if (!('data' in result)) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load tours. Please try again later.</p>
      </div>
    );
  }

  const { tours, totalPages, currentPage } = result.data;

  if (tours.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No tours found matching your criteria.</p>
        <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return <TourGrid tours={tours} totalPages={totalPages} currentPage={currentPage} totalCount={result.data.totalCount} />;
}

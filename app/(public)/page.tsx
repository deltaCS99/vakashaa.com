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
import { resolveScope, type ScopeValue } from "@/lib/scope";

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
    durationRange?: string;
    priceRange?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedScope = resolveScope({
    scopeParam: searchParams.scope,
    country: searchParams.country,
    localDestination: searchParams.localDestination,
  });

  // Show hero only if filters beyond scope/page are active
  const hasFilters = Object.entries(searchParams).some(([key, value]) => {
    if (key === "scope" || key === "page") return false;
    return typeof value === "string" && value.length > 0;
  });

  const blogResult = await getPublishedBlogPosts();
  const blogPosts =
    blogResult.success && "data" in blogResult
      ? blogResult.data.posts.slice(0, 3)
      : [];

  const localDestList = searchParams.localDestination?.split(",").filter(Boolean) ?? [];
  const countryList = searchParams.country?.split(",").filter(Boolean) ?? [];

  const heading =
    searchParams.search
      ? `Search results for "${searchParams.search}"`
      : localDestList.length > 0
        ? `Tours in ${localDestList.join(", ")}`
        : countryList.length > 0
          ? `Tours in ${countryList.join(", ")}`
          : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Only show when no filters beyond scope/page */}
      {!hasFilters && <HeroSection />}

      {/* Filters Section - sticky */}
      <section className="sticky top-16 z-40 border-b border-slate-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="container mx-auto px-4 py-1">
          <TourFilters defaultValues={searchParams} scope={resolvedScope} />
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
          <ToursContent searchParams={searchParams} resolvedScope={resolvedScope} />
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

async function ToursContent({
  searchParams,
  resolvedScope,
}: {
  searchParams: HomePageProps['searchParams'];
  resolvedScope: ScopeValue;
}) {
  const durationRanges: Record<string, { minDuration?: number; maxDuration?: number }> = {
    weekend: { maxDuration: 3 },
    short: { minDuration: 4, maxDuration: 7 },
    extended: { minDuration: 8, maxDuration: 14 },
    expedition: { minDuration: 15 },
  };
  const priceRanges: Record<string, { minPrice?: number; maxPrice?: number }> = {
    budget: { maxPrice: 5000 },
    comfort: { minPrice: 5000, maxPrice: 10000 },
    premium: { minPrice: 10000, maxPrice: 20000 },
    luxury: { minPrice: 20000 },
  };

  const selectedDuration = searchParams.durationRange ? durationRanges[searchParams.durationRange] : undefined;
  const selectedPrice = searchParams.priceRange ? priceRanges[searchParams.priceRange] : undefined;
  const localDestinations = searchParams.localDestination?.split(",").filter(Boolean) ?? [];
  const countries = searchParams.country?.split(",").filter(Boolean) ?? [];
  const categories = searchParams.category?.split(",").filter(Boolean) ?? [];

  const result = await getTours({
    localDestinations,
    countries,
    scope: resolvedScope,
    categories,
    minPrice: selectedPrice?.minPrice ?? (searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined),
    maxPrice: selectedPrice?.maxPrice ?? (searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined),
    minDuration: selectedDuration?.minDuration,
    maxDuration: selectedDuration?.maxDuration,
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

// app/(public)/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { getTours, getLocalDestinations, getInternationalCountries } from "@/actions/tours";
import { TourFilters } from "@/components/tours/tour-filters";
import { TourGrid } from "@/components/tours/tour-grid";
import { TourGridSkeleton } from "@/components/tours/tour-grid-skeleton";
import { HeroSection } from "@/components/home/hero-section";

export const metadata: Metadata = {
  title: "Browse Tours - Discover South Africa",
  description: "Find and book amazing tours across South Africa. From wildlife safaris to city tours, discover your perfect adventure with verified local operators.",
  keywords: ["South Africa tours", "domestic tours", "safari", "Cape Town tours", "Kruger tours"],
};

interface HomePageProps {
  searchParams: {
    localDestination?: string;
    country?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    page?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Fetch destinations for hero
  const localDestsResult = await getLocalDestinations();
  const internationalCountriesResult = await getInternationalCountries();

  const localDestinations =
    localDestsResult.success && "data" in localDestsResult
      ? localDestsResult.data.destinations
      : [];

  const internationalCountries =
    internationalCountriesResult.success && "data" in internationalCountriesResult
      ? internationalCountriesResult.data.countries
      : [];

  // Show hero only if no filters are active
  const hasFilters = Object.keys(searchParams).length > 0;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section - Only show when no filters */}
      {!hasFilters && (
        <HeroSection
          localDestinations={localDestinations}
          internationalCountries={internationalCountries}
        />
      )}

      {/* Filters Section - Sticky on scroll */}
      <section className="sticky top-16 z-40 bg-white border-b shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4">
          <TourFilters defaultValues={searchParams} />
        </div>
      </section>

      {/* Tours Grid */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {searchParams.search
              ? `Search results for "${searchParams.search}"`
              : searchParams.localDestination
                ? `Tours in ${searchParams.localDestination}`
                : searchParams.country
                  ? `Tours in ${searchParams.country}`
                  : "All Tours"}
          </h1>
        </div>

        <Suspense fallback={<TourGridSkeleton />}>
          <ToursContent searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}

async function ToursContent({ searchParams }: { searchParams: HomePageProps['searchParams'] }) {
  const result = await getTours({
    localDestination: searchParams.localDestination,
    country: searchParams.country,
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

  return <TourGrid tours={tours} totalPages={totalPages} currentPage={currentPage} />;
}
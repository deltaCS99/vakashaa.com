// components/tours/tour-grid.tsx
"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { TourCard } from "./tour-card";
import { Button } from "@/components/ui/button";
import { SOUTH_AFRICAN_PROVINCES, type SouthAfricanProvince } from "@/lib/regions";

interface Tour {
    id: string;
    title: string;
    description: string;
    duration: string;
    priceFrom: number | null; // In cents: R2,500 = 250000
    currency: string;
    countries: string[];
    region: string | null;
    category: string | null;
    images: string[];
    maxCapacity?: number | null;
    destinations: string[];
    inclusions: string[];
    rating?: number | null;
}

interface TourGridProps {
    tours: Tour[];
    totalPages: number;
    currentPage: number;
}

const MULTI_PROVINCE_LABEL = "Across South Africa";
const MULTI_COUNTRY_LABEL = "Multi-country journeys";
const SCROLL_STEP = 320;

const isProvinceName = (label: string): label is SouthAfricanProvince =>
    SOUTH_AFRICAN_PROVINCES.includes(label as SouthAfricanProvince);

const pluralizeTourCount = (count: number) => (count === 1 ? "tour" : "tours");

const getGroupLabel = (tour: Tour) => {
    const onlySouthAfrica = tour.countries.length === 1 && tour.countries[0] === "South Africa";

    if (onlySouthAfrica) {
        return tour.region ?? MULTI_PROVINCE_LABEL;
    }

    if (tour.countries.length === 1) {
        return `Explore ${tour.countries[0]}`;
    }

    if (tour.countries.length === 0) {
        return tour.region ?? MULTI_PROVINCE_LABEL;
    }

    return MULTI_COUNTRY_LABEL;
};

const getGroupSubtitle = (label: string, count: number) => {
    const toursWord = pluralizeTourCount(count);

    if (isProvinceName(label)) {
        return `${count} ${toursWord} in ${label}`;
    }

    if (label === MULTI_PROVINCE_LABEL) {
        return `${count} ${toursWord} that span multiple provinces`;
    }

    if (label === MULTI_COUNTRY_LABEL) {
        return `${count} ${toursWord} crossing borders`;
    }

    if (label.startsWith("Explore ")) {
        const country = label.replace("Explore ", "");
        return `${count} ${toursWord} in ${country}`;
    }

    return `${count} ${toursWord}`;
};

const getHeading = (label: string) => {
    if (isProvinceName(label)) {
        return `Stay in ${label}`;
    }

    return label;
};

const sortGroupedEntries = (groups: Record<string, Tour[]>) => {
    const entries = Object.entries(groups);

    entries.sort((a, b) => {
        const aIndex = SOUTH_AFRICAN_PROVINCES.indexOf(a[0] as SouthAfricanProvince);
        const bIndex = SOUTH_AFRICAN_PROVINCES.indexOf(b[0] as SouthAfricanProvince);

        if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
        }

        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        return a[0].localeCompare(b[0]);
    });

    return entries;
};

export function TourGrid({ tours, totalPages, currentPage }: TourGridProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const groupedTours = useMemo(() => {
        return tours.reduce<Record<string, Tour[]>>((acc, tour) => {
            const groupKey = getGroupLabel(tour);
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(tour);
            return acc;
        }, {});
    }, [tours]);

    const sortedGroups = useMemo(() => sortGroupedEntries(groupedTours), [groupedTours]);

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`/?${params.toString()}`);
    };

    const handleScroll = (label: string, direction: "left" | "right") => {
        const container = scrollRefs.current[label];
        if (!container) return;

        const amount = direction === "left" ? -SCROLL_STEP : SCROLL_STEP;
        container.scrollBy({
            left: amount,
            behavior: "smooth",
        });
    };

    if (tours.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">No tours found matching your criteria.</p>
                <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your filters or search terms.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {sortedGroups.map(([label, provinceTours]) => (
                <section key={label} className="space-y-3">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{getHeading(label)}</h2>
                            <p className="text-sm text-muted-foreground">
                                {getGroupSubtitle(label, provinceTours.length)}
                            </p>
                        </div>
                        {isProvinceName(label) && (
                            <Link
                                href={`/?localDestination=${encodeURIComponent(label)}`}
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                View all
                            </Link>
                        )}
                    </div>

                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 hidden md:flex items-center justify-center">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="pointer-events-auto rounded-full shadow-md"
                                onClick={() => handleScroll(label, "left")}
                                aria-label={`Scroll ${label} tours left`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="pointer-events-none absolute inset-y-0 right-0 hidden md:flex items-center justify-center">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="pointer-events-auto rounded-full shadow-md"
                                onClick={() => handleScroll(label, "right")}
                                aria-label={`Scroll ${label} tours right`}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <div
                            ref={(el) => {
                                scrollRefs.current[label] = el;
                            }}
                            className="flex gap-4 overflow-x-auto pb-4 pr-2 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {provinceTours.map((tour) => (
                                <div
                                    key={tour.id}
                                    className="flex-shrink-0 snap-start w-[260px] sm:w-[300px] lg:w-[320px]"
                                >
                                    <TourCard tour={tour} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            ))}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                                return (
                                    <Button
                                        key={page}
                                        variant={page === currentPage ? "default" : "outline"}
                                        size="sm"
                                        className="w-10"
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </Button>
                                );
                            }

                            if (page === currentPage - 2 || page === currentPage + 2) {
                                return (
                                    <span key={page} className="px-2 py-1 text-muted-foreground">
                                        ...
                                    </span>
                                );
                            }
                            return null;
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

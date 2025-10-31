// components/tours/tour-grid.tsx
"use client";

import { TourCard } from "./tour-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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
}

interface TourGridProps {
    tours: Tour[];
    totalPages: number;
    currentPage: number;
}

export function TourGrid({ tours, totalPages, currentPage }: TourGridProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="space-y-8">
            {/* Tour Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tours.map((tour) => (
                    <TourCard key={tour.id} tour={tour} />
                ))}
            </div>

            {/* Empty State */}
            {tours.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">
                        No tours found matching your criteria.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Try adjusting your filters or search terms.
                    </p>
                </div>
            )}

            {/* Pagination */}
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

                    {/* Page numbers */}
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            // Show first page, last page, current page, and pages around current
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
                            // Show ellipsis
                            if (page === currentPage - 2 || page === currentPage + 2) {
                                return <span key={page} className="px-2 py-1">...</span>;
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
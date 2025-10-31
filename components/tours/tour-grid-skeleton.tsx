// components/tours/tour-grid-skeleton.tsx
import { Card } from "@/components/ui/card";

export function TourGridSkeleton() {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <TourCardSkeleton key={i} />
            ))}
        </div>
    );
}

function TourCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            {/* Image skeleton */}
            <div className="h-48 bg-gray-200 animate-pulse" />

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />

                {/* Location & Duration */}
                <div className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Price */}
                <div className="pt-2 border-t">
                    <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-24 mt-1 animate-pulse" />
                </div>

                {/* Operator */}
                <div className="pt-2 border-t">
                    <div className="h-3 bg-gray-200 rounded w-36 animate-pulse" />
                </div>
            </div>
        </Card>
    );
}
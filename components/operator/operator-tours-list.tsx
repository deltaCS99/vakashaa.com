// components/operator/operator-tours-list.tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Package } from "lucide-react";
import { OperatorTourCard } from "./operator-tour-card";

interface Tour {
    id: string;
    title: string;
    description: string;
    duration: string;
    category: string | null;
    priceFrom: number | null;
    currency: string;
    countries: string[];
    region: string | null;
    destinations: string[];
    images: string[];
    maxCapacity: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
        quoteRequests: number;
    };
}

interface OperatorToursListProps {
    tours: Tour[];
    operatorProfileId: string;
}

const STATUS_FILTERS = [
    { label: "All Tours", value: "all" },
    { label: "Live", value: "active" },
    { label: "Hidden", value: "inactive" },
];

export function OperatorToursList({ tours, operatorProfileId }: OperatorToursListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

    // Filter tours
    const filteredTours = tours.filter((tour) => {
        // Status filter
        if (statusFilter === "active" && !tour.isActive) return false;
        if (statusFilter === "inactive" && tour.isActive) return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                tour.title.toLowerCase().includes(query) ||
                tour.description.toLowerCase().includes(query) ||
                tour.countries.some((c) => c.toLowerCase().includes(query)) ||
                tour.destinations.some((d) => d.toLowerCase().includes(query)) ||
                tour.category?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    // Count by status
    const statusCounts = {
        all: tours.length,
        active: tours.filter((t) => t.isActive).length,
        inactive: tours.filter((t) => !t.isActive).length,
    };

    // Empty state
    if (tours.length === 0) {
        return (
            <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">No Tours Yet</h3>
                        <p className="text-gray-600">Create your first tour to start receiving quote requests</p>
                    </div>
                </div>
            </Card>
        );
    }

    const getEmptyStateMessage = () => {
        switch (statusFilter) {
            case "active":
                return "No live tours. Activate a tour to make it visible to customers.";
            case "inactive":
                return "No hidden tours. Great!";
            default:
                return "No tours found matching your filters.";
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Filters */}
            <Card className="p-4">
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tours by title, location, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
                        />
                    </div>

                    {/* Status Filters */}
                    <div className="flex flex-wrap gap-2">
                        {STATUS_FILTERS.map((filter) => {
                            const count = statusCounts[filter.value as keyof typeof statusCounts] || 0;
                            const isActive = statusFilter === filter.value;

                            return (
                                <Button
                                    key={filter.value}
                                    variant={isActive ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setStatusFilter(filter.value as "all" | "active" | "inactive")}
                                >
                                    {filter.label}
                                    {count > 0 && (
                                        <span
                                            className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive ? "bg-white/20" : "bg-primary/10"
                                                }`}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Results count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    {filteredTours.length === tours.length
                        ? `${filteredTours.length} tour${filteredTours.length !== 1 ? "s" : ""}`
                        : `${filteredTours.length} of ${tours.length} tours`}
                </p>
            </div>

            {/* Tours Grid */}
            {filteredTours.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTours.map((tour) => (
                        <OperatorTourCard key={tour.id} tour={tour} operatorProfileId={operatorProfileId} />
                    ))}
                </div>
            ) : (
                <Card className="p-8 text-center">
                    <p className="text-gray-600">
                        {getEmptyStateMessage()}
                    </p>
                    <Button
                        variant="link"
                        onClick={() => {
                            setStatusFilter("all");
                            setSearchQuery("");
                        }}
                        className="mt-2"
                    >
                        Clear filters
                    </Button>
                </Card>
            )}
        </div>
    );
}
// components/operator/operator-tours-list.tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

    const activeTours = tours.filter((t) => t.isActive).length;
    const inactiveTours = tours.filter((t) => !t.isActive).length;

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

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card className="p-4">
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search tours by title, location, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Status Filters */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={statusFilter === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("all")}
                        >
                            All Tours
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                                {tours.length}
                            </span>
                        </Button>
                        <Button
                            variant={statusFilter === "active" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("active")}
                        >
                            Active
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                                {activeTours}
                            </span>
                        </Button>
                        <Button
                            variant={statusFilter === "inactive" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("inactive")}
                        >
                            Inactive
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                                {inactiveTours}
                            </span>
                        </Button>
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
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTours.map((tour) => (
                        <OperatorTourCard key={tour.id} tour={tour} operatorProfileId={operatorProfileId} />
                    ))}
                </div>
            ) : (
                <Card className="p-8 text-center">
                    <p className="text-gray-600">No tours found matching your filters.</p>
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
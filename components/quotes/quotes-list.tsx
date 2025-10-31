// components/quotes/quotes-list.tsx
"use client";

import { useState } from "react";
import { QuoteCard } from "./quote-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquareQuote, Search } from "lucide-react";
import Link from "next/link";
import { QuoteStatus } from "@prisma/client";

interface Quote {
    id: string;
    reference: string;
    status: QuoteStatus;
    preferredDate: string;
    flexibleDates: boolean;
    adults: number;
    children: number;
    quotedPrice: number | null;
    quoteExpiresAt: Date | null;
    createdAt: Date;
    tour: {
        id: string;
        title: string;
        images: string[];
        duration: string;
        countries: string[];
        region: string | null;
    };
    messages: Array<{
        id: string;
        message: string;
        createdAt: Date;
    }>;
}

interface QuotesListProps {
    quoteRequests: Quote[];
}

const STATUS_FILTERS = [
    { label: "All", value: "all" },
    { label: "Pending", value: QuoteStatus.Pending },
    { label: "Quoted", value: QuoteStatus.Quoted },
    { label: "Accepted", value: QuoteStatus.Accepted },
    { label: "Paid", value: QuoteStatus.Paid },
    { label: "Rejected", value: QuoteStatus.Rejected },
    { label: "Cancelled", value: QuoteStatus.Cancelled },
    { label: "Expired", value: QuoteStatus.Expired },
];

export function QuotesList({ quoteRequests }: QuotesListProps) {
    const [selectedFilter, setSelectedFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter quotes
    const filteredQuotes = quoteRequests.filter((quote) => {
        // Status filter
        if (selectedFilter !== "all" && quote.status !== selectedFilter) {
            return false;
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                quote.reference.toLowerCase().includes(query) ||
                quote.tour.title.toLowerCase().includes(query) ||
                quote.tour.countries.some((country) =>
                    country.toLowerCase().includes(query)
                )
            );
        }

        return true;
    });

    // Count by status
    const statusCounts = quoteRequests.reduce((acc, quote) => {
        acc[quote.status] = (acc[quote.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Empty state
    if (quoteRequests.length === 0) {
        return (
            <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquareQuote className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">No Quote Requests Yet</h3>
                        <p className="text-gray-600 mb-6">
                            Start exploring tours and request custom quotes from operators
                        </p>
                    </div>
                    <Button asChild size="lg">
                        <Link href="/">Browse Tours</Link>
                    </Button>
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
                        <input
                            type="text"
                            placeholder="Search by reference, tour name, or destination..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Status Filters */}
                    <div className="flex flex-wrap gap-2">
                        {STATUS_FILTERS.map((filter) => {
                            const count = filter.value === "all"
                                ? quoteRequests.length
                                : statusCounts[filter.value] || 0;

                            const isActive = selectedFilter === filter.value;

                            return (
                                <Button
                                    key={filter.value}
                                    variant={isActive ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedFilter(filter.value)}
                                    className="relative"
                                >
                                    {filter.label}
                                    {count > 0 && (
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive ? "bg-white/20" : "bg-primary/10"
                                            }`}>
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
                    {filteredQuotes.length === quoteRequests.length
                        ? `${filteredQuotes.length} quote${filteredQuotes.length !== 1 ? "s" : ""}`
                        : `${filteredQuotes.length} of ${quoteRequests.length} quotes`}
                </p>
            </div>

            {/* Quotes Grid */}
            {filteredQuotes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredQuotes.map((quote) => (
                        <QuoteCard key={quote.id} quote={quote} />
                    ))}
                </div>
            ) : (
                <Card className="p-8 text-center">
                    <p className="text-gray-600">
                        No quotes found matching your filters.
                    </p>
                    <Button
                        variant="link"
                        onClick={() => {
                            setSelectedFilter("all");
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
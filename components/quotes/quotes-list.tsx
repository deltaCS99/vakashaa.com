// components/quotes/quotes-list.tsx
"use client";

import { useState } from "react";
import { QuoteCard } from "./quote-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquareQuote, Search, AlertCircle } from "lucide-react";
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

// Only show quote-phase statuses (exclude booking statuses)
const STATUS_FILTERS = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" }, // Pending + Quoted + Accepted
    { label: "Needs Action", value: "needs_action" }, // Quoted + expiring soon
    { label: "Pending", value: QuoteStatus.Pending },
    { label: "Quoted", value: QuoteStatus.Quoted },
    { label: "Accepted", value: QuoteStatus.Accepted },
    { label: "Rejected", value: QuoteStatus.Rejected },
    { label: "Cancelled", value: QuoteStatus.Cancelled },
    { label: "Expired", value: QuoteStatus.Expired },
];

export function QuotesList({ quoteRequests }: QuotesListProps) {
    const [selectedFilter, setSelectedFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Helper: Check if quote is expiring soon (within 24 hours)
    const isExpiringSoon = (quote: Quote) => {
        if (!quote.quoteExpiresAt || quote.status !== QuoteStatus.Quoted) return false;
        const timeUntilExpiry = new Date(quote.quoteExpiresAt).getTime() - Date.now();
        return timeUntilExpiry > 0 && timeUntilExpiry < 24 * 60 * 60 * 1000;
    };

    // Filter quotes
    const filteredQuotes = quoteRequests.filter((quote) => {
        // Status filter
        if (selectedFilter === "active") {
            // ✅ Fix: Use array of strings instead of enum values for includes check
            const activeStatuses: QuoteStatus[] = [
                QuoteStatus.Pending,
                QuoteStatus.Quoted,
                QuoteStatus.Accepted
            ];
            if (!activeStatuses.includes(quote.status)) {
                return false;
            }
        } else if (selectedFilter === "needs_action") {
            // Needs Action = Quoted and expiring soon
            if (!isExpiringSoon(quote)) {
                return false;
            }
        } else if (selectedFilter !== "all" && quote.status !== selectedFilter) {
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
    const activeStatuses: QuoteStatus[] = [
        QuoteStatus.Pending,
        QuoteStatus.Quoted,
        QuoteStatus.Accepted
    ];

    const statusCounts = {
        all: quoteRequests.length,
        active: quoteRequests.filter(q => activeStatuses.includes(q.status)).length,
        needs_action: quoteRequests.filter(q => isExpiringSoon(q)).length,
        [QuoteStatus.Pending]: quoteRequests.filter(q => q.status === QuoteStatus.Pending).length,
        [QuoteStatus.Quoted]: quoteRequests.filter(q => q.status === QuoteStatus.Quoted).length,
        [QuoteStatus.Accepted]: quoteRequests.filter(q => q.status === QuoteStatus.Accepted).length,
        [QuoteStatus.Rejected]: quoteRequests.filter(q => q.status === QuoteStatus.Rejected).length,
        [QuoteStatus.Cancelled]: quoteRequests.filter(q => q.status === QuoteStatus.Cancelled).length,
        [QuoteStatus.Expired]: quoteRequests.filter(q => q.status === QuoteStatus.Expired).length,
    };

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

    // Get empty state message based on filter
    const getEmptyStateMessage = () => {
        switch (selectedFilter) {
            case QuoteStatus.Pending:
                return "No pending quotes. All your requests have been responded to.";
            case QuoteStatus.Quoted:
                return "No quotes received yet. Check back soon!";
            case QuoteStatus.Accepted:
                return "No accepted quotes awaiting payment.";
            case "active":
                return "No active quote requests.";
            case "needs_action":
                return "No quotes need immediate attention. Great!";
            default:
                return "No quotes found matching your filters.";
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
                            placeholder="Search by reference, tour name, or destination..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
                        />
                    </div>

                    {/* Status Filters */}
                    <div className="flex flex-wrap gap-2">
                        {STATUS_FILTERS.map((filter) => {
                            const count = statusCounts[filter.value as keyof typeof statusCounts] || 0;
                            const isActive = selectedFilter === filter.value;
                            const isNeedsAction = filter.value === "needs_action" && count > 0;

                            return (
                                <Button
                                    key={filter.value}
                                    variant={isActive ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedFilter(filter.value)}
                                    className={`relative ${isNeedsAction && !isActive ? "border-orange-500 text-orange-700" : ""}`}
                                >
                                    {isNeedsAction && !isActive && (
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                    )}
                                    {filter.label}
                                    {count > 0 && (
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive
                                                ? "bg-white/20"
                                                : isNeedsAction
                                                    ? "bg-orange-100 text-orange-800"
                                                    : "bg-primary/10"
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

            {/* Needs Action Alert */}
            {statusCounts.needs_action > 0 && selectedFilter !== "needs_action" && (
                <Card className="p-4 border-orange-200 bg-orange-50">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-semibold text-orange-900">
                                {statusCounts.needs_action} quote{statusCounts.needs_action !== 1 ? "s" : ""} expiring soon!
                            </p>
                            <p className="text-sm text-orange-700">
                                Review and accept quotes before they expire.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedFilter("needs_action")}
                            className="border-orange-600 text-orange-700 hover:bg-orange-100"
                        >
                            View
                        </Button>
                    </div>
                </Card>
            )}

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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredQuotes.map((quote) => (
                        <QuoteCard key={quote.id} quote={quote} />
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
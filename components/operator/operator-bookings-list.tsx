// components/operator/operator-bookings-list.tsx
"use client";

import { useState } from "react";
import { OperatorBookingCard } from "./operator-booking-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Search, AlertCircle } from "lucide-react";

interface Booking {
    id: string;
    reference: string;
    confirmedTourDate: Date | null;
    confirmedTourEndDate: Date | null;
    paidAmount: number | null;
    tourCompletedByOperator: boolean | null;
    tourCompletedAt: Date | null;
    tourConfirmedByCustomer: boolean | null;
    disputeReason: string | null;
    tour: {
        id: string;
        title: string;
        images: string[];
    };
    user: {
        name: string | null;
    };
}

interface OperatorBookingsListProps {
    bookings: Booking[];
}

const BOOKING_FILTERS = [
    { label: "All", value: "all" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Past", value: "past" },
    { label: "Needs Action", value: "needs_action" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Disputed", value: "disputed" },
];

export function OperatorBookingsList({ bookings }: OperatorBookingsListProps) {
    const [selectedFilter, setSelectedFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const now = new Date();

    // Helper functions
    const isUpcoming = (booking: Booking) => {
        return booking.confirmedTourDate && new Date(booking.confirmedTourDate) > now;
    };

    const isPast = (booking: Booking) => {
        return booking.confirmedTourDate && new Date(booking.confirmedTourDate) <= now;
    };

    const needsAction = (booking: Booking) => {
        return (
            booking.confirmedTourEndDate &&
            new Date(booking.confirmedTourEndDate) < now &&
            !booking.tourCompletedByOperator
        );
    };

    const isConfirmed = (booking: Booking) => {
        return booking.tourConfirmedByCustomer === true;
    };

    const isDisputed = (booking: Booking) => {
        return booking.disputeReason !== null;
    };

    // Filter bookings
    const filteredBookings = bookings.filter((booking) => {
        // Status filter
        if (selectedFilter === "upcoming" && !isUpcoming(booking)) return false;
        if (selectedFilter === "past" && !isPast(booking)) return false;
        if (selectedFilter === "needs_action" && !needsAction(booking)) return false;
        if (selectedFilter === "confirmed" && !isConfirmed(booking)) return false;
        if (selectedFilter === "disputed" && !isDisputed(booking)) return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                booking.reference.toLowerCase().includes(query) ||
                booking.tour.title.toLowerCase().includes(query) ||
                booking.user.name?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    // Count by status
    const statusCounts = {
        all: bookings.length,
        upcoming: bookings.filter(isUpcoming).length,
        past: bookings.filter(isPast).length,
        needs_action: bookings.filter(needsAction).length,
        confirmed: bookings.filter(isConfirmed).length,
        disputed: bookings.filter(isDisputed).length,
    };

    // Empty state
    if (bookings.length === 0) {
        return (
            <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
                        <p className="text-gray-600">
                            Confirmed bookings from customers will appear here
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    const getEmptyStateMessage = () => {
        switch (selectedFilter) {
            case "upcoming":
                return "No upcoming tours scheduled.";
            case "past":
                return "No past tours yet.";
            case "needs_action":
                return "No bookings need marking as complete. Great!";
            case "confirmed":
                return "No confirmed tours yet.";
            case "disputed":
                return "No disputed bookings.";
            default:
                return "No bookings found matching your filters.";
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
                            placeholder="Search by reference, tour, or customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
                        />
                    </div>

                    {/* Status Filters */}
                    <div className="flex flex-wrap gap-2">
                        {BOOKING_FILTERS.map((filter) => {
                            const count = statusCounts[filter.value as keyof typeof statusCounts] || 0;
                            const isActive = selectedFilter === filter.value;
                            const isNeedsAction = filter.value === "needs_action" && count > 0;

                            return (
                                <Button
                                    key={filter.value}
                                    variant={isActive ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedFilter(filter.value)}
                                    className={`relative ${isNeedsAction && !isActive ? "border-green-500 text-green-700" : ""}`}
                                >
                                    {isNeedsAction && !isActive && (
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                    )}
                                    {filter.label}
                                    {count > 0 && (
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive
                                            ? "bg-white/20"
                                            : isNeedsAction
                                                ? "bg-green-100 text-green-800"
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
                <Card className="p-4 border-green-200 bg-green-50">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-semibold text-green-900">
                                {statusCounts.needs_action} tour{statusCounts.needs_action !== 1 ? 's' : ''} ready to mark complete!
                            </p>
                            <p className="text-sm text-green-700">
                                Mark tours as complete so customers can confirm.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedFilter("needs_action")}
                            className="border-green-600 text-green-700 hover:bg-green-100"
                        >
                            View
                        </Button>
                    </div>
                </Card>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    {filteredBookings.length === bookings.length
                        ? `${filteredBookings.length} booking${filteredBookings.length !== 1 ? "s" : ""}`
                        : `${filteredBookings.length} of ${bookings.length} bookings`}
                </p>
            </div>

            {/* Bookings Grid */}
            {filteredBookings.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredBookings.map((booking) => (
                        <OperatorBookingCard key={booking.id} booking={booking} />
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
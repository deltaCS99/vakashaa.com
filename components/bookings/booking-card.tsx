// components/bookings/booking-card.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { formatPrice } from "@/lib/utils";

interface BookingCardProps {
    booking: {
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
    };
}

export function BookingCard({ booking }: BookingCardProps) {
    const defaultImage = "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop";

    const getStatusBadge = () => {
        if (booking.disputeReason) {
            return (
                <Badge variant="destructive" className="text-xs">
                    Disputed
                </Badge>
            );
        }
        if (booking.tourConfirmedByCustomer) {
            return (
                <Badge className="bg-green-600 text-xs">
                    Completed
                </Badge>
            );
        }
        if (booking.tourCompletedByOperator) {
            return (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Needs Action
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="text-xs">
                Confirmed
            </Badge>
        );
    };

    const needsAction = () => {
        return (
            booking.tourCompletedByOperator &&
            !booking.tourConfirmedByCustomer &&
            !booking.disputeReason
        );
    };

    const getDaysInfo = () => {
        if (!booking.confirmedTourDate || !booking.confirmedTourEndDate) {
            return null;
        }

        const days = Math.ceil(
            (new Date(booking.confirmedTourEndDate).getTime() -
                new Date(booking.confirmedTourDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        return `${days} day${days !== 1 ? 's' : ''}`;
    };

    return (
        <Link href={`/bookings/${booking.id}`}>
            <Card className={`overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group ${needsAction() ? "border-orange-300 bg-orange-50" : ""
                }`}>
                {/* Compact Image - 80px height */}
                <div className="relative h-20 bg-gray-200">
                    <Image
                        src={booking.tour.images[0] || defaultImage}
                        alt={booking.tour.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-1.5 right-1.5">
                        {getStatusBadge()}
                    </div>
                </div>

                {/* Compact Content */}
                <div className="p-3 space-y-2">
                    {/* Tour Title + Reference */}
                    <div>
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {booking.tour.title}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">{booking.reference}</p>
                    </div>

                    {/* Tour Dates - Compact */}
                    {booking.confirmedTourDate && booking.confirmedTourEndDate ? (
                        <div className="text-xs text-gray-600">
                            <div className="flex items-center gap-1 mb-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span>
                                    {format(new Date(booking.confirmedTourDate), "MMM dd")} -{" "}
                                    {format(new Date(booking.confirmedTourEndDate), "MMM dd, yyyy")}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 ml-4">
                                {getDaysInfo()} • {formatDistanceToNow(new Date(booking.confirmedTourDate), { addSuffix: true })}
                            </p>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-500 italic">
                            Awaiting date confirmation
                        </div>
                    )}

                    {/* Action Required Alert - Inline */}
                    {needsAction() && (
                        <div className="bg-orange-100 border border-orange-300 rounded px-2 py-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-orange-600 flex-shrink-0" />
                            <span className="text-xs text-orange-800 font-medium">Confirmation needed!</span>
                        </div>
                    )}

                    {/* Amount Paid - Compact */}
                    {booking.paidAmount && (
                        <div className="flex items-baseline justify-between pt-2 border-t">
                            <div>
                                <p className="text-xs text-gray-500">Paid</p>
                                <p className="text-lg font-bold text-primary">
                                    {formatPrice(booking.paidAmount)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Compact Action Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8"
                    >
                        {needsAction() ? "Take Action" : "View Details"}
                    </Button>
                </div>
            </Card>
        </Link>
    );
}
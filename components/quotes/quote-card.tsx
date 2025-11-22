// components/quotes/quote-card.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { QuoteStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { formatPrice } from "@/lib/utils";

interface QuoteCardProps {
    quote: {
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
    };
}

const STATUS_CONFIG = {
    [QuoteStatus.Pending]: {
        label: "Pending",
        icon: Loader2,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    [QuoteStatus.Quoted]: {
        label: "Quoted",
        icon: MessageSquare,
        className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    [QuoteStatus.Accepted]: {
        label: "Accepted",
        icon: CheckCircle2,
        className: "bg-purple-100 text-purple-800 border-purple-200",
    },
    [QuoteStatus.Paid]: {
        label: "Confirmed",
        icon: CheckCircle2,
        className: "bg-green-100 text-green-800 border-green-200",
    },
    [QuoteStatus.Completed]: {
        label: "Completed",
        icon: CheckCircle2,
        className: "bg-green-600 text-white border-green-600",
    },
    [QuoteStatus.Disputed]: {
        label: "Disputed",
        icon: AlertCircle,
        className: "bg-red-100 text-red-800 border-red-200",
    },
    [QuoteStatus.Refunded]: {
        label: "Refunded",
        icon: XCircle,
        className: "bg-gray-100 text-gray-800 border-gray-200",
    },
    [QuoteStatus.Rejected]: {
        label: "Rejected",
        icon: XCircle,
        className: "bg-gray-100 text-gray-800 border-gray-200",
    },
    [QuoteStatus.Cancelled]: {
        label: "Cancelled",
        icon: XCircle,
        className: "bg-red-100 text-red-800 border-red-200",
    },
    [QuoteStatus.Expired]: {
        label: "Expired",
        icon: AlertCircle,
        className: "bg-orange-100 text-orange-800 border-orange-200",
    },
};

export function QuoteCard({ quote }: QuoteCardProps) {
    const statusConfig = STATUS_CONFIG[quote.status];
    const StatusIcon = statusConfig.icon;
    const defaultImage = "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop";

    const timeUntilExpiry = quote.quoteExpiresAt
        ? new Date(quote.quoteExpiresAt).getTime() - Date.now()
        : null;

    const isExpiringSoon = timeUntilExpiry !== null
        && quote.status === QuoteStatus.Quoted
        && timeUntilExpiry > 0
        && timeUntilExpiry < 24 * 60 * 60 * 1000;

    const totalGuests = quote.adults + quote.children;
    const hasMessages = quote.messages.length > 0;

    return (
        <Link href={`/quotes/${quote.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                {/* Compact Image - 80px height */}
                <div className="relative h-20 bg-gray-200">
                    <Image
                        src={quote.tour.images[0] || defaultImage}
                        alt={quote.tour.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-1.5 right-1.5">
                        <Badge
                            variant="secondary"
                            className={`${statusConfig.className} flex items-center gap-1 text-xs px-2 py-0.5`}
                        >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                        </Badge>
                    </div>

                    {/* Message Indicator */}
                    {hasMessages && !isExpiringSoon && (
                        <div className="absolute top-1.5 left-1.5">
                            <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs px-2 py-0.5">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {quote.messages.length}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Compact Content */}
                <div className="p-3 space-y-2">
                    {/* Tour Title + Reference on same line */}
                    <div>
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {quote.tour.title}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">{quote.reference}</p>
                    </div>

                    {/* Compact Info - Single Line */}
                    <div className="text-xs text-gray-600">
                        <span>{totalGuests} guest{totalGuests !== 1 ? 's' : ''}</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span>{quote.tour.region || quote.tour.countries[0]}</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span>{quote.tour.duration}</span>
                    </div>

                    {/* Date - Compact */}
                    <div className="text-xs text-gray-500">
                        {new Date(quote.preferredDate).toLocaleDateString('en-ZA', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                        {quote.flexibleDates && <span className="text-gray-400 ml-1">(Flexible)</span>}
                    </div>

                    {/* Expiring Soon Alert - Inline */}
                    {isExpiringSoon && (
                        <div className="bg-red-50 border border-red-200 rounded px-2 py-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
                            <span className="text-xs text-red-800 font-medium">Expiring soon!</span>
                        </div>
                    )}

                    {/* Quote Price - Compact */}
                    {quote.quotedPrice && (quote.status === QuoteStatus.Quoted || quote.status === QuoteStatus.Expired) && (
                        <div className="flex items-baseline justify-between pt-2 border-t">
                            <div>
                                <p className="text-xs text-gray-500">Quote</p>
                                <p className="text-lg font-bold text-primary">{formatPrice(quote.quotedPrice)}</p>
                            </div>
                            {quote.quoteExpiresAt && !isExpiringSoon && (
                                <p className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(quote.quoteExpiresAt), { addSuffix: true })}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Compact Action Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8"
                    >
                        {isExpiringSoon ? "Review Now" : "View Details"}
                    </Button>
                </div>
            </Card>
        </Link>
    );
}

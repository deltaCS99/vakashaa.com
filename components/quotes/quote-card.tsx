// components/quotes/quote-card.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Users,
    MapPin,
    Clock,
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
        description: "Awaiting operator response",
    },
    [QuoteStatus.Quoted]: {
        label: "Quoted",
        icon: MessageSquare,
        className: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Quote received",
    },
    [QuoteStatus.Accepted]: {
        label: "Accepted",
        icon: CheckCircle2,
        className: "bg-purple-100 text-purple-800 border-purple-200",
        description: "Awaiting payment",
    },
    [QuoteStatus.Paid]: {
        label: "Confirmed",
        icon: CheckCircle2,
        className: "bg-green-100 text-green-800 border-green-200",
        description: "Booking confirmed",
    },
    [QuoteStatus.Rejected]: {
        label: "Rejected",
        icon: XCircle,
        className: "bg-gray-100 text-gray-800 border-gray-200",
        description: "Quote declined",
    },
    [QuoteStatus.Cancelled]: {
        label: "Cancelled",
        icon: XCircle,
        className: "bg-red-100 text-red-800 border-red-200",
        description: "Request cancelled",
    },
    [QuoteStatus.Expired]: {
        label: "Expired",
        icon: AlertCircle,
        className: "bg-orange-100 text-orange-800 border-orange-200",
        description: "Quote validity expired",
    },
};

export function QuoteCard({ quote }: QuoteCardProps) {
    const statusConfig = STATUS_CONFIG[quote.status];
    const StatusIcon = statusConfig.icon;
    const defaultImage = "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop";

    const formatPrice = (priceInCents: number) => {
        const rands = priceInCents / 100;
        return `R${rands.toLocaleString('en-ZA')}`;
    };

    const isExpiringSoon = quote.quoteExpiresAt && quote.status === QuoteStatus.Quoted
        ? new Date(quote.quoteExpiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
        : false;

    const totalGuests = quote.adults + quote.children;
    const hasMessages = quote.messages.length > 0;

    return (
        <Link href={`/quotes/${quote.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full cursor-pointer">
                {/* Tour Image */}
                <div className="relative h-40 bg-gray-200">
                    <Image
                        src={quote.tour.images[0] || defaultImage}
                        alt={quote.tour.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                        <Badge
                            variant="secondary"
                            className={`${statusConfig.className} flex items-center gap-1`}
                        >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                        </Badge>
                    </div>

                    {/* Message Indicator */}
                    {hasMessages && (
                        <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {quote.messages.length}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    {/* Reference */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-mono text-gray-500">{quote.reference}</p>
                        <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(quote.createdAt), { addSuffix: true })}
                        </p>
                    </div>

                    {/* Tour Title */}
                    <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem]">
                        {quote.tour.title}
                    </h3>

                    {/* Tour Info */}
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                                {quote.tour.region || quote.tour.countries[0]}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{quote.tour.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>
                                {new Date(quote.preferredDate).toLocaleDateString('en-ZA', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                                {quote.flexibleDates && " (Flexible)"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>
                                {quote.adults} Adult{quote.adults !== 1 ? "s" : ""}
                                {quote.children > 0 && `, ${quote.children} Child${quote.children !== 1 ? "ren" : ""}`}
                            </span>
                        </div>
                    </div>

                    {/* Quote Price */}
                    {quote.quotedPrice && quote.status === QuoteStatus.Quoted && (
                        <div className="pt-3 border-t">
                            <div className="flex items-baseline justify-between">
                                <div>
                                    <p className="text-xs text-gray-600">Quoted Price</p>
                                    <p className="text-xl font-bold text-primary">
                                        {formatPrice(quote.quotedPrice)}
                                    </p>
                                </div>
                                {isExpiringSoon && (
                                    <Badge variant="destructive" className="text-xs">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Expiring Soon
                                    </Badge>
                                )}
                            </div>
                            {quote.quoteExpiresAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Expires {formatDistanceToNow(new Date(quote.quoteExpiresAt), { addSuffix: true })}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Status Description */}
                    {quote.status !== QuoteStatus.Quoted && (
                        <div className="pt-3 border-t">
                            <p className="text-sm text-gray-600">{statusConfig.description}</p>
                        </div>
                    )}

                    {/* Action Button */}
                    <Button variant="outline" className="w-full" asChild>
                        <span>
                            View Details
                            {quote.status === QuoteStatus.Quoted && " & Accept"}
                            {quote.status === QuoteStatus.Pending && " & Message"}
                        </span>
                    </Button>
                </div>
            </Card>
        </Link>
    );
}
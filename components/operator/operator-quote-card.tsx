// components/operator/operator-quote-card.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader2,
    Clock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { QuoteStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

interface OperatorQuoteCardProps {
    quote: {
        id: string;
        reference: string;
        status: QuoteStatus;
        preferredDate: string;
        flexibleDates: boolean;
        adults: number;
        children: number;
        budgetRange: string | null;
        quotedPrice: number | null;
        createdAt: Date;
        tour: {
            id: string;
            title: string;
            images: string[];
            duration: string;
        };
        user: {
            name: string | null;
            email: string | null;
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
        className: "bg-green-100 text-green-800 border-green-200",
    },
    [QuoteStatus.Disputed]: {
        label: "Disputed",
        icon: AlertCircle,
        className: "bg-orange-100 text-orange-800 border-orange-200",
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
} as const;

export function OperatorQuoteCard({ quote }: OperatorQuoteCardProps) {
    const statusConfig = STATUS_CONFIG[quote.status];
    const StatusIcon = statusConfig.icon;
    const defaultImage = "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop";

    const formatPrice = (priceInCents: number) => {
        return `R${(priceInCents / 100).toLocaleString('en-ZA')}`;
    };

    const totalGuests = quote.adults + quote.children;
    const hasMessages = quote.messages.length > 0;
    const isPending = quote.status === QuoteStatus.Pending;

    return (
        <Link href={`/operator/quotes/${quote.id}`}>
            <Card className={`overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group ${isPending ? "border-yellow-300 bg-yellow-50" : ""
                }`}>
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
                    {hasMessages && (
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
                    {/* Tour Title + Reference */}
                    <div>
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {quote.tour.title}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">{quote.reference}</p>
                    </div>

                    {/* Customer Name */}
                    <div className="text-xs text-gray-600">
                        <span className="font-medium">{quote.user.name}</span>
                    </div>

                    {/* Compact Info - Single Line */}
                    <div className="text-xs text-gray-600">
                        <span>{totalGuests} guest{totalGuests !== 1 ? 's' : ''}</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span>{quote.tour.duration}</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span>{new Date(quote.preferredDate).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</span>
                        {quote.flexibleDates && <span className="text-gray-400 ml-1">(Flex)</span>}
                    </div>

                    {/* Budget Range */}
                    {quote.budgetRange && (
                        <div className="text-xs text-gray-500">
                            Budget: {quote.budgetRange}
                        </div>
                    )}

                    {/* Pending Alert - Inline */}
                    {isPending && (
                        <div className="bg-yellow-100 border border-yellow-300 rounded px-2 py-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                            <span className="text-xs text-yellow-800 font-medium">Needs response!</span>
                        </div>
                    )}

                    {/* Quote Price - Compact */}
                    {quote.quotedPrice && quote.status !== QuoteStatus.Pending && (
                        <div className="flex items-baseline justify-between pt-2 border-t">
                            <div>
                                <p className="text-xs text-gray-500">Your Quote</p>
                                <p className="text-lg font-bold text-primary">{formatPrice(quote.quotedPrice)}</p>
                            </div>
                        </div>
                    )}

                    {/* Time Since Created */}
                    <div className="text-xs text-gray-400 pt-1">
                        {formatDistanceToNow(new Date(quote.createdAt), { addSuffix: true })}
                    </div>

                    {/* Compact Action Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8"
                    >
                        {isPending ? "Respond Now" : "View Details"}
                    </Button>
                </div>
            </Card>
        </Link>
    );
}
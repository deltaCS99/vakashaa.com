// components/quotes/quote-details-accordion.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp,
    Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface QuoteDetailsAccordionProps {
    quoteRequest: any;
}

export function QuoteDetailsAccordion({ quoteRequest }: QuoteDetailsAccordionProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Move formatPrice inside the component
    const formatPrice = (priceInCents: number) => {
        return `R${(priceInCents / 100).toLocaleString('en-ZA')}`;
    };

    const isExpiringSoon = quoteRequest.quoteExpiresAt
        ? new Date(quoteRequest.quoteExpiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
        : false;

    return (
        <Card className="mb-4 border-2 border-primary/20">
            <CardContent className="p-0">
                {/* Header - Always Visible */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">Operator&apos;s Quote</h3>
                            {quoteRequest.revisionCount > 0 && (
                                <span className="text-xs text-gray-500">
                                    (Rev. {quoteRequest.revisionCount})
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-primary">
                            {formatPrice(quoteRequest.quotedPrice)}
                        </p>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </button>

                {/* Expandable Content */}
                {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                        <Separator />

                        {/* Expiry Warning */}
                        {isExpiringSoon && quoteRequest.quoteExpiresAt && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                                <Clock className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs">
                                    <p className="font-semibold text-orange-900">Expiring Soon!</p>
                                    <p className="text-orange-700">
                                        Expires {formatDistanceToNow(new Date(quoteRequest.quoteExpiresAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Valid Until */}
                        {quoteRequest.quoteExpiresAt && !isExpiringSoon && (
                            <div className="text-xs text-gray-600">
                                Valid until {format(new Date(quoteRequest.quoteExpiresAt), "PPp")}
                            </div>
                        )}

                        {/* Suggested Tour Dates */}
                        {quoteRequest.confirmedTourDate && quoteRequest.confirmedTourEndDate && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <h4 className="text-xs font-semibold text-blue-900">Suggested Tour Dates</h4>
                                </div>
                                <p className="text-sm font-bold text-blue-900">
                                    {format(new Date(quoteRequest.confirmedTourDate), "MMM dd")} -{" "}
                                    {format(new Date(quoteRequest.confirmedTourEndDate), "MMM dd, yyyy")}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    {Math.ceil(
                                        (new Date(quoteRequest.confirmedTourEndDate).getTime() -
                                            new Date(quoteRequest.confirmedTourDate).getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    )}{" "}
                                    day tour
                                </p>
                            </div>
                        )}

                        {/* Inclusions */}
                        {quoteRequest.quotedInclusions &&
                            Array.isArray(quoteRequest.quotedInclusions) &&
                            quoteRequest.quotedInclusions.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1 text-gray-700">
                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                        Included
                                    </h4>
                                    <ul className="space-y-1">
                                        {(quoteRequest.quotedInclusions as Array<{ item: string; price: number | null }>).map(
                                            (inclusion, index) => (
                                                <li key={index} className="flex items-start gap-2 text-xs">
                                                    <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span className="flex-1">{inclusion.item}</span>
                                                    {inclusion.price && (
                                                        <span className="font-medium text-primary">
                                                            +{formatPrice(inclusion.price)}
                                                        </span>
                                                    )}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}

                        {/* Exclusions */}
                        {quoteRequest.quotedExclusions &&
                            Array.isArray(quoteRequest.quotedExclusions) &&
                            quoteRequest.quotedExclusions.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1 text-gray-700">
                                        <XCircle className="w-3 h-3 text-red-600" />
                                        Not Included
                                    </h4>
                                    <ul className="space-y-1">
                                        {(quoteRequest.quotedExclusions as Array<{ item: string; price: number | null }>).map(
                                            (exclusion, index) => (
                                                <li key={index} className="flex items-start gap-2 text-xs">
                                                    <XCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span className="flex-1">{exclusion.item}</span>
                                                    {exclusion.price && (
                                                        <span className="text-gray-600">
                                                            {formatPrice(exclusion.price)}
                                                        </span>
                                                    )}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}

                        {/* Terms */}
                        {quoteRequest.quotedTerms && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <h4 className="text-xs font-semibold mb-1 text-amber-900">Terms & Conditions</h4>
                                <p className="text-xs text-amber-800 whitespace-pre-wrap">
                                    {quoteRequest.quotedTerms}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
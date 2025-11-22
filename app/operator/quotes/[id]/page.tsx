// app/operator/quotes/[id]/page.tsx
import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOperatorProfile } from "@/lib/operator";
import { getOperatorQuoteRequestById } from "@/actions/operator/quotes";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Users,
    MapPin,
    Clock,
    DollarSign,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { OperatorQuoteResponseForm } from "@/components/operator/operator-quote-response-form";
import { QuoteChatWidget } from "@/components/quotes/quote-chat-widget";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Quote Details | SA Tours Operator",
    description: "View and respond to quote request",
};

interface PageProps {
    params: {
        id: string;
    };
}

export default async function OperatorQuoteDetailPage({ params }: PageProps) {
    const user = await currentUser();

    if (!user || user.role !== "Operator") {
        redirect("/login");
    }

    const operatorProfile = await getOperatorProfile();

    if (!operatorProfile || !operatorProfile.isApproved) {
        redirect("/operator/quotes");
    }

    // Fetch quote request
    const result = await getOperatorQuoteRequestById(params.id);

    if (!result.success || !("data" in result)) {
        notFound();
    }

    const { quoteRequest } = result.data;
    const defaultImage =
        "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=600&fit=crop";

    const totalGuests = quoteRequest.adults + quoteRequest.children;
    const hasQuoted = quoteRequest.status !== "Pending";

    return (
        <div className="min-h-screen bg-gray-50/50 pb-8">
            <div className="container mx-auto px-4 py-4 md:py-6">
                {/* Back Button */}
                <Button variant="ghost" size="sm" asChild className="mb-4">
                    <Link href="/operator/quotes">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </Button>

                {/* Sticky Context Bar */}
                <div className="bg-white border rounded-lg p-4 mb-6 sticky top-16 md:top-20 z-20 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg md:text-xl font-bold">Quote {quoteRequest.reference}</h1>
                                <Badge variant="outline" className="text-xs">
                                    {quoteRequest.status}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-600">
                                <span className="font-medium">{quoteRequest.user.name}</span>
                                <span className="text-gray-300">•</span>
                                <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{totalGuests} guest{totalGuests !== 1 ? 's' : ''}</span>
                                </div>
                                <span className="text-gray-300">•</span>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{format(new Date(quoteRequest.preferredDate), "MMM dd, yyyy")}</span>
                                </div>
                            </div>
                        </div>
                        {hasQuoted && quoteRequest.quotedPrice && (
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Current Quote</p>
                                <p className="text-lg font-bold text-primary">
                                    {formatPrice(quoteRequest.quotedPrice)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3-Column Grid Layout */}
                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Left Sidebar - Customer & Requirements */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Customer Information - NO CONTACT DETAILS */}
                        <Card>
                            <CardHeader className="pb-3">
                                <h2 className="text-sm font-semibold">Customer</h2>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="font-medium text-gray-900">{quoteRequest.user.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        All communication via platform chat
                                    </p>
                                </div>

                                {/* Info Box */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-800">
                                        <AlertCircle className="w-3 h-3 inline mr-1" />
                                        Use the chat widget to communicate with the customer
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Trip Requirements */}
                        <Card>
                            <CardHeader className="pb-3">
                                <h2 className="text-sm font-semibold">Requirements</h2>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Preferred Date</p>
                                    <p className="font-medium">
                                        {format(new Date(quoteRequest.preferredDate), "MMM dd, yyyy")}
                                        {quoteRequest.flexibleDates && (
                                            <span className="text-xs text-gray-500 ml-1">(Flexible)</span>
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Group Size</p>
                                    <p className="font-medium">
                                        {quoteRequest.adults} Adult{quoteRequest.adults !== 1 ? "s" : ""}
                                        {quoteRequest.children > 0 &&
                                            `, ${quoteRequest.children} Child${quoteRequest.children !== 1 ? "ren" : ""}`}
                                    </p>
                                    {quoteRequest.childAges.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Ages: {quoteRequest.childAges.join(", ")}
                                        </p>
                                    )}
                                </div>

                                {quoteRequest.budgetRange && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Budget</p>
                                        <p className="font-medium">{quoteRequest.budgetRange}</p>
                                    </div>
                                )}

                                {quoteRequest.specialRequirements && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Special Requests</p>
                                        <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                            {quoteRequest.specialRequirements}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Center - Quote Form (Main Action) */}
                    <div className="lg:col-span-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">
                                        {hasQuoted ? "Update Quote" : "Respond to Quote"}
                                    </h2>
                                    {quoteRequest.revisionCount > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                            Revision {quoteRequest.revisionCount}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <OperatorQuoteResponseForm
                                    quoteRequestId={quoteRequest.id}
                                    preferredDate={quoteRequest.preferredDate}
                                    existingQuote={
                                        hasQuoted
                                            ? {
                                                quotedPrice: quoteRequest.quotedPrice!,
                                                confirmedTourDate: quoteRequest.confirmedTourDate!,
                                                confirmedTourEndDate: quoteRequest.confirmedTourEndDate!,
                                                quotedInclusions: (quoteRequest.quotedInclusions &&
                                                    Array.isArray(quoteRequest.quotedInclusions))
                                                    ? quoteRequest.quotedInclusions as Array<{ item: string; price: number | null }>
                                                    : [],
                                                quotedExclusions: (quoteRequest.quotedExclusions &&
                                                    Array.isArray(quoteRequest.quotedExclusions))
                                                    ? quoteRequest.quotedExclusions as Array<{ item: string; price: number | null }>
                                                    : [],
                                                quotedTerms: quoteRequest.quotedTerms || "",
                                                quoteValidityHours: quoteRequest.quoteValidityHours || 72,
                                            }
                                            : undefined
                                    }
                                    isRevision={hasQuoted}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Sidebar - Tour Info & Previous Quote */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Compact Tour Info */}
                        <Card>
                            <CardHeader className="pb-3">
                                <h2 className="text-sm font-semibold">Tour</h2>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Small Tour Image */}
                                {quoteRequest.tour.images?.[0] && (
                                    <div className="relative h-24 w-full rounded-lg overflow-hidden bg-gray-200">
                                        <Image
                                            src={quoteRequest.tour.images[0] || defaultImage}
                                            alt={quoteRequest.tour.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-semibold text-sm mb-1">{quoteRequest.tour.title}</h3>
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{quoteRequest.tour.countries[0]}</span>
                                        </div>
                                        <span className="text-gray-300">•</span>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{quoteRequest.tour.duration}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Floating Chat Widget - Platform Communication Only */}
            <QuoteChatWidget
                quoteRequestId={quoteRequest.id}
                messages={quoteRequest.messages}
                currentUserId={operatorProfile.userId}
                userRole="operator"
            />
        </div>
    );
}
// app/(customer)/quotes/[id]/page.tsx
import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getQuoteRequestById } from "@/actions/quote-requests";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Calendar,
    Users,
    MapPin,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Loader2,
    DollarSign,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { QuoteStatus } from "@prisma/client";
import { format, formatDistanceToNow } from "date-fns";
import { QuoteChatWidget } from "@/components/quotes/quote-chat-widget";
import { QuoteActions } from "@/components/quotes/quote-actions";
import { QuoteDetailsAccordion } from "@/components/quotes/quote-details-accordion";

interface QuoteDetailPageProps {
    params: {
        id: string;
    };
}

export async function generateMetadata({
    params,
}: QuoteDetailPageProps): Promise<Metadata> {
    return {
        title: "Quote Details | SA Tours",
        description: "View your tour quote request details",
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
        icon: DollarSign,
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

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
    const user = await currentUser();

    if (!user || !user.id) {
        redirect("/login");
    }

    // Fetch quote request
    const result = await getQuoteRequestById(params.id);

    if (!result.success || !('data' in result)) {
        notFound();
    }

    const { quoteRequest } = result.data;

    // Redirect to bookings page if quote is paid or beyond
    if ([QuoteStatus.Paid, QuoteStatus.Completed, QuoteStatus.Disputed, QuoteStatus.Refunded].includes(quoteRequest.status)) {
        redirect(`/bookings/${quoteRequest.id}`);
    }

    const statusConfig = STATUS_CONFIG[quoteRequest.status];
    const StatusIcon = statusConfig.icon;
    const defaultImage = "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=600&fit=crop";

    const totalGuests = quoteRequest.adults + quoteRequest.children;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32 md:pb-8">
            <div className="container mx-auto px-4 py-4 md:py-8">
                {/* Back Button */}
                <Button variant="ghost" size="sm" asChild className="mb-4 md:mb-6">
                    <Link href="/quotes">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </Button>

                {/* Header - Compact */}
                <div className="mb-4 md:mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-xl md:text-2xl font-bold">Quote {quoteRequest.reference}</h1>
                        <Badge variant="secondary" className={`${statusConfig.className} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                        </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(quoteRequest.createdAt), { addSuffix: true })}
                    </p>
                </div>

                {/* Grid Layout: Main Content + Sidebar */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Tour Summary Card - Compact */}
                        <Card className="overflow-hidden">
                            <div className="flex gap-3 p-4">
                                {/* Small Image */}
                                {quoteRequest.tour.images.length > 0 && (
                                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                        <Image
                                            src={quoteRequest.tour.images[0] || defaultImage}
                                            alt={quoteRequest.tour.title}
                                            fill
                                            className="object-cover"
                                            sizes="96px"
                                        />
                                    </div>
                                )}

                                {/* Tour Info */}
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-semibold text-base md:text-lg mb-2 line-clamp-2">
                                        {quoteRequest.tour.title}
                                    </h2>

                                    {/* Compact Info Chips */}
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{quoteRequest.tour.region || quoteRequest.tour.countries[0]}</span>
                                        </div>
                                        <span className="text-gray-300">•</span>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{quoteRequest.tour.duration}</span>
                                        </div>
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
                            </div>
                        </Card>

                        {/* Your Requirements - Compact */}
                        {quoteRequest.specialRequirements && (
                            <Card>
                                <CardContent className="p-4">
                                    <h3 className="text-sm font-semibold mb-2 text-gray-700">Your Requirements</h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                        {quoteRequest.specialRequirements}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quote Details - Expandable */}
                        {quoteRequest.quotedPrice && (
                            <QuoteDetailsAccordion quoteRequest={quoteRequest} />
                        )}

                        {/* Pending State */}
                        {quoteRequest.status === QuoteStatus.Pending && (
                            <Card>
                                <CardContent className="p-6 text-center">
                                    <Loader2 className="w-8 h-8 mx-auto mb-3 text-yellow-500 animate-spin" />
                                    <h3 className="font-semibold mb-1">Awaiting Response</h3>
                                    <p className="text-sm text-gray-600">
                                        The operator will respond within 24 hours.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Rejected/Cancelled/Expired States */}
                        {quoteRequest.status === QuoteStatus.Rejected && quoteRequest.rejectionReason && (
                            <Card className="border-gray-200">
                                <CardContent className="p-4">
                                    <h3 className="text-sm font-semibold mb-2 text-gray-700">Rejection Reason</h3>
                                    <p className="text-sm text-gray-600">{quoteRequest.rejectionReason}</p>
                                </CardContent>
                            </Card>
                        )}

                        {quoteRequest.status === QuoteStatus.Cancelled && quoteRequest.cancellationReason && (
                            <Card className="border-gray-200">
                                <CardContent className="p-4">
                                    <h3 className="text-sm font-semibold mb-2 text-gray-700">Cancellation Reason</h3>
                                    <p className="text-sm text-gray-600">{quoteRequest.cancellationReason}</p>
                                </CardContent>
                            </Card>
                        )}

                        {quoteRequest.status === QuoteStatus.Expired && (
                            <Card className="border-orange-200 bg-orange-50">
                                <CardContent className="p-4 text-center">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                                    <h3 className="font-semibold mb-1 text-orange-900">Quote Expired</h3>
                                    <p className="text-sm text-orange-700 mb-3">
                                        This quote has expired. Request a new quote to continue.
                                    </p>
                                    <Button size="sm" asChild>
                                        <Link href={`/tours/${quoteRequest.tour.id}`}>Request New Quote</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Actions (Desktop) + Mobile Sticky Bottom */}
                    <div className="lg:col-span-1">
                        <QuoteActions quoteRequest={quoteRequest} />
                    </div>
                </div>
            </div>

            {/* Floating Chat Widget */}
            <QuoteChatWidget
                quoteRequestId={quoteRequest.id}
                messages={quoteRequest.messages}
                currentUserId={user.id}
                userRole="customer"
            />
        </div>
    );
}
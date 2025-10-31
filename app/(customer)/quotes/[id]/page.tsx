// app/(customer)/quotes/[id]/page.tsx
import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getQuoteRequestById } from "@/actions/quote-requests";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Calendar,
    Users,
    MapPin,
    Clock,
    MessageSquareQuote,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Loader2,
    DollarSign,
    FileText,
    Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { QuoteStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { QuoteMessages } from "@/components/quotes/quote-messages";
import { QuoteActions } from "@/components/quotes/quote-actions";

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
        icon: MessageSquareQuote,
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
    const statusConfig = STATUS_CONFIG[quoteRequest.status];
    const StatusIcon = statusConfig.icon;
    const defaultImage = "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=600&fit=crop";

    const formatPrice = (priceInCents: number) => {
        const rands = priceInCents / 100;
        return `R${rands.toLocaleString('en-ZA')}`;
    };

    const showQuoteDetails = ([
        QuoteStatus.Quoted,
        QuoteStatus.Accepted,
        QuoteStatus.Paid,
        QuoteStatus.Rejected,
        QuoteStatus.Cancelled,
        QuoteStatus.Expired,
    ] as QuoteStatus[]).includes(quoteRequest.status);

    const totalGuests = quoteRequest.adults + quoteRequest.children;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-4 md:py-8 pb-24 md:pb-8">
                {/* Back Button */}
                <Button variant="ghost" asChild className="mb-4 md:mb-6">
                    <Link href="/quotes">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Quotes
                    </Link>
                </Button>

                {/* Header */}
                <div className="mb-4 md:mb-6">
                    <div className="flex flex-col gap-3 mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold">Quote Request</h1>
                            <Badge variant="secondary" className={`${statusConfig.className} flex items-center gap-1 w-fit`}>
                                <StatusIcon className="w-4 h-4" />
                                {statusConfig.label}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm md:text-base text-gray-600">Reference: {quoteRequest.reference}</p>
                            <p className="text-xs md:text-sm text-gray-500">
                                Submitted {formatDistanceToNow(new Date(quoteRequest.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile: Actions at Top */}
                <div className="md:hidden mb-6">
                    <QuoteActions quoteRequest={quoteRequest} />
                </div>

                <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">
                        {/* Tour Information */}
                        <Card className="overflow-hidden">
                            {/* Tour Image */}
                            {quoteRequest.tour.images.length > 0 && (
                                <div className="relative h-64 bg-gray-200">
                                    <Image
                                        src={quoteRequest.tour.images[0] || defaultImage}
                                        alt={quoteRequest.tour.title}
                                        fill
                                        className="object-cover"
                                        priority
                                        sizes="(max-width: 1024px) 100vw, 66vw"
                                    />
                                </div>
                            )}

                            <div className="p-6 space-y-4">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">{quoteRequest.tour.title}</h2>
                                    <p className="text-gray-600">{quoteRequest.tour.description}</p>
                                </div>

                                <Separator />

                                {/* Tour Details Grid */}
                                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-gray-500">Location</p>
                                            <p className="font-medium">
                                                {quoteRequest.tour.region || quoteRequest.tour.countries.join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-gray-500">Duration</p>
                                            <p className="font-medium">{quoteRequest.tour.duration}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-gray-500">Preferred Date</p>
                                            <p className="font-medium">
                                                {new Date(quoteRequest.preferredDate).toLocaleDateString('en-ZA', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                                {quoteRequest.flexibleDates && " (Flexible)"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-gray-500">Guests</p>
                                            <p className="font-medium">
                                                {quoteRequest.adults} Adult{quoteRequest.adults !== 1 ? "s" : ""}
                                                {quoteRequest.children > 0 &&
                                                    `, ${quoteRequest.children} Child${quoteRequest.children !== 1 ? "ren" : ""}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Child Ages */}
                                {quoteRequest.childAges && quoteRequest.childAges.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Children&apos;s Ages</p>
                                        <p className="font-medium">{quoteRequest.childAges.join(", ")} years old</p>
                                    </div>
                                )}

                                {/* Budget Range */}
                                {quoteRequest.budgetRange && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Budget Range</p>
                                        <p className="font-medium">{quoteRequest.budgetRange}</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Special Requirements */}
                        {quoteRequest.specialRequirements && (
                            <Card className="p-6">
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-2">Your Requirements</h3>
                                        <p className="text-gray-600 whitespace-pre-line">
                                            {quoteRequest.specialRequirements}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Operator's Quote Details */}
                        {quoteRequest.quotedPrice && showQuoteDetails && (
                            <Card className="p-6 border-2 border-primary/20">
                                <div className="flex items-start gap-3 mb-4">
                                    <DollarSign className="w-6 h-6 text-primary" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-1">Operator&apos;s Quote</h3>
                                        <p className="text-gray-600">
                                            Valid until {new Date(quoteRequest.quoteExpiresAt!).toLocaleString('en-ZA')}
                                        </p>
                                    </div>
                                </div>

                                {/* Quoted Price */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-gray-600 mb-1">Total Quoted Price</p>
                                    <p className="text-3xl font-bold text-primary">
                                        {formatPrice(quoteRequest.quotedPrice)}
                                    </p>
                                </div>

                                {/* Quoted Inclusions */}
                                {quoteRequest.quotedInclusions && Array.isArray(quoteRequest.quotedInclusions) && quoteRequest.quotedInclusions.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            Inclusions
                                        </h4>
                                        <ul className="space-y-2">
                                            {(quoteRequest.quotedInclusions as Array<{ item: string; price: number | null }>).map((inclusion, index) => (
                                                <li key={index} className="flex items-start justify-between text-sm">
                                                    <span className="flex items-start gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                        <span>{inclusion.item}</span>
                                                    </span>
                                                    {inclusion.price && (
                                                        <span className="font-medium text-primary">
                                                            +{formatPrice(inclusion.price)}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Quoted Exclusions */}
                                {quoteRequest.quotedExclusions && Array.isArray(quoteRequest.quotedExclusions) && quoteRequest.quotedExclusions.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                            <XCircle className="w-4 h-4 text-red-600" />
                                            Not Included
                                        </h4>
                                        <ul className="space-y-2">
                                            {(quoteRequest.quotedExclusions as Array<{ item: string; price: number | null }>).map((exclusion, index) => (
                                                <li key={index} className="flex items-start justify-between text-sm">
                                                    <span className="flex items-start gap-2">
                                                        <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                        <span>{exclusion.item}</span>
                                                    </span>
                                                    {exclusion.price && (
                                                        <span className="text-gray-600">
                                                            {formatPrice(exclusion.price)}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Quoted Terms */}
                                {quoteRequest.quotedTerms && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <h4 className="font-semibold mb-2 text-sm">Terms & Conditions</h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-line">
                                            {quoteRequest.quotedTerms}
                                        </p>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Messages Section */}
                        <Card className="p-6">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <MessageSquareQuote className="w-5 h-5" />
                                Conversation
                            </h3>
                            <QuoteMessages
                                quoteRequestId={quoteRequest.id}
                                messages={quoteRequest.messages}
                                currentUserId={user.id}
                            />
                        </Card>
                    </div>

                    {/* Sidebar - Actions (Desktop Only) */}
                    <div className="hidden md:block lg:col-span-1">
                        <QuoteActions quoteRequest={quoteRequest} />
                    </div>
                </div>
            </div>
        </div>
    );
}
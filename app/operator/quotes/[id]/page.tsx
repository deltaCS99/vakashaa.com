// app/operator/quotes/[id]/page.tsx
import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOperatorProfile } from "@/lib/operator";
import { getOperatorQuoteRequestById } from "@/actions/operator/quotes";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    Users,
    MapPin,
    Clock,
    Mail,
    Phone,
    MessageSquare,
    DollarSign,
    AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { OperatorQuoteResponseForm } from "@/components/operator/operator-quote-response-form";
import { OperatorQuoteMessages } from "@/components/operator/operator-quote-messages";

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
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">Quote Request</h1>
                        <Badge variant="outline" className="font-mono">
                            {quoteRequest.reference}
                        </Badge>
                    </div>
                    <p className="text-gray-600">
                        {hasQuoted ? "Update your quote or message the customer" : "Respond to this quote request"}
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content - Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tour Details Card */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold">Tour Details</h2>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Tour Image */}
                                <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-200">
                                    <Image
                                        src={quoteRequest.tour.images?.[0] || defaultImage}
                                        alt={quoteRequest.tour.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold mb-2">{quoteRequest.tour.title}</h3>
                                    <p className="text-gray-600 text-sm">{quoteRequest.tour.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        <span>{quoteRequest.tour.countries.join(", ")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span>{quoteRequest.tour.duration}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quote Response Form */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">
                                        {hasQuoted ? "Update Quote" : "Respond to Quote Request"}
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
                                    existingQuote={
                                        hasQuoted
                                            ? {
                                                quotedPrice: quoteRequest.quotedPrice!,
                                                quotedInclusions: quoteRequest.quotedInclusions as any,
                                                quotedExclusions: quoteRequest.quotedExclusions as any,
                                                quotedTerms: quoteRequest.quotedTerms || "",
                                                quoteValidityHours: quoteRequest.quoteValidityHours || 72,
                                            }
                                            : undefined
                                    }
                                    isRevision={hasQuoted}
                                />
                            </CardContent>
                        </Card>

                        {/* Messages */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    <h2 className="text-lg font-semibold">Messages</h2>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <OperatorQuoteMessages
                                    quoteRequestId={quoteRequest.id}
                                    messages={quoteRequest.messages}
                                    currentUserId={operatorProfile.userId}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Right Column (1/3) */}
                    <div className="space-y-6">
                        {/* Customer Information */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold">Customer Information</h2>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Only show full contact details after payment */}
                                {quoteRequest.status === "Paid" ? (
                                    <>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Name</p>
                                            <p className="text-sm text-gray-900">{quoteRequest.user.name}</p>
                                        </div>
                                        <Separator />
                                        <div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-4 h-4 text-gray-500" />
                                                <a
                                                    href={`mailto:${quoteRequest.user.email}`}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {quoteRequest.user.email}
                                                </a>
                                            </div>
                                        </div>
                                        {quoteRequest.user.phone && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Phone className="w-4 h-4 text-gray-500" />
                                                        <a
                                                            href={`tel:${quoteRequest.user.phone}`}
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {quoteRequest.user.phone}
                                                        </a>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {quoteRequest.user.whatsappNumber && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MessageSquare className="w-4 h-4 text-gray-500" />
                                                        <a
                                                            href={`https://wa.me/${quoteRequest.user.whatsappNumber}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-green-600 hover:underline"
                                                        >
                                                            WhatsApp
                                                        </a>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm">
                                                    <p className="font-semibold text-yellow-900 mb-1">
                                                        Contact Details Protected
                                                    </p>
                                                    <p className="text-yellow-700">
                                                        Customer contact information will be available once they accept and pay
                                                        for your quote.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Name</p>
                                            <p className="text-sm text-gray-900">{quoteRequest.user.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                (Full contact details available after payment)
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Trip Requirements */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold">Trip Requirements</h2>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="flex items-center gap-2 text-sm mb-1">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">Preferred Date</span>
                                    </div>
                                    <p className="text-sm text-gray-900 ml-6">
                                        {format(new Date(quoteRequest.preferredDate), "MMMM dd, yyyy")}
                                        {quoteRequest.flexibleDates && (
                                            <span className="text-xs text-gray-500 ml-2">(Flexible)</span>
                                        )}
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <div className="flex items-center gap-2 text-sm mb-1">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">Group Size</span>
                                    </div>
                                    <p className="text-sm text-gray-900 ml-6">
                                        {quoteRequest.adults} Adult{quoteRequest.adults !== 1 ? "s" : ""}
                                        {quoteRequest.children > 0 &&
                                            `, ${quoteRequest.children} Child${quoteRequest.children !== 1 ? "ren" : ""
                                            }`}
                                    </p>
                                    <p className="text-xs text-gray-500 ml-6">Total: {totalGuests} guests</p>
                                    {quoteRequest.childAges.length > 0 && (
                                        <p className="text-xs text-gray-500 ml-6 mt-1">
                                            Child ages: {quoteRequest.childAges.join(", ")}
                                        </p>
                                    )}
                                </div>
                                {quoteRequest.budgetRange && (
                                    <>
                                        <Separator />
                                        <div>
                                            <div className="flex items-center gap-2 text-sm mb-1">
                                                <DollarSign className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">Budget Range</span>
                                            </div>
                                            <p className="text-sm text-gray-900 ml-6">{quoteRequest.budgetRange}</p>
                                        </div>
                                    </>
                                )}
                                {quoteRequest.specialRequirements && (
                                    <>
                                        <Separator />
                                        <div>
                                            <div className="flex items-center gap-2 text-sm mb-1">
                                                <AlertCircle className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">Special Requirements</span>
                                            </div>
                                            <p className="text-sm text-gray-700 ml-6 whitespace-pre-wrap">
                                                {quoteRequest.specialRequirements}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Current Quote Status */}
                        {hasQuoted && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold">Current Quote</h2>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Quoted Price</p>
                                        <p className="text-2xl font-bold text-primary">
                                            R
                                            {((quoteRequest.quotedPrice || 0) / 100).toLocaleString("en-ZA", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                    </div>
                                    {quoteRequest.quoteExpiresAt && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p className="text-sm text-gray-600">Valid Until</p>
                                                <p className="text-sm text-gray-900">
                                                    {format(new Date(quoteRequest.quoteExpiresAt), "MMM dd, yyyy HH:mm")}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    <Separator />
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <Badge variant="outline" className="mt-1">
                                            {quoteRequest.status}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
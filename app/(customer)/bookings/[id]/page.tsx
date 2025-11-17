// app/(customer)/bookings/[id]/page.tsx
import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getCustomerBookingById } from "@/actions/bookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { BookingActions } from "@/components/bookings/booking-actions";

export const metadata: Metadata = {
    title: "Booking Details | SA Tours",
    description: "View your booking details",
};

interface BookingDetailPageProps {
    params: {
        id: string;
    };
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
    // Fetch booking using server action
    const result = await getCustomerBookingById(params.id);

    if (!result.success) {
        if (result.error.code === 401) {
            redirect("/login");
        }
        if (result.error.code === 404) {
            notFound();
        }
        redirect("/bookings");
    }

    // Type guard to ensure data exists
    if (!result.success || !("data" in result)) {
        notFound();
    }

    const booking = result.data.booking;

    const defaultImage =
        "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=600&fit=crop";

    const formatPrice = (priceInCents: number) => {
        return `R${(priceInCents / 100).toLocaleString("en-ZA")}`;
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-4 md:py-8 pb-24 md:pb-8">
                {/* Back Button */}
                <Button variant="ghost" asChild className="mb-4 md:mb-6">
                    <Link href="/bookings">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Bookings
                    </Link>
                </Button>

                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Booking Details</h1>
                            <p className="text-sm md:text-base text-gray-600 mt-1">
                                Reference: <span className="font-mono font-semibold">{booking.reference}</span>
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {booking.disputeReason && <Badge variant="destructive">Disputed</Badge>}
                            {booking.tourConfirmedByCustomer && (
                                <Badge className="bg-green-600">Completed</Badge>
                            )}
                            {booking.tourCompletedByOperator && !booking.tourConfirmedByCustomer && (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Needs Your Confirmation
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tour Information */}
                        <Card>
                            <CardContent className="p-6">
                                {/* Tour Image */}
                                <div className="relative h-48 md:h-64 w-full rounded-lg overflow-hidden bg-gray-200 mb-4">
                                    <Image
                                        src={booking.tour.images?.[0] || defaultImage}
                                        alt={booking.tour.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                <h2 className="text-xl md:text-2xl font-bold mb-2">{booking.tour.title}</h2>
                                <p className="text-gray-600 text-sm md:text-base mb-4">
                                    {booking.tour.description}
                                </p>

                                <Separator className="my-4" />

                                {/* Tour Details */}
                                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-gray-500">Location</p>
                                            <p className="font-medium">
                                                {booking.tour.region || booking.tour.countries.join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-gray-500">Duration</p>
                                            <p className="font-medium">{booking.tour.duration}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Confirmed Tour Dates */}
                        {booking.confirmedTourDate && booking.confirmedTourEndDate && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Confirmed Tour Dates
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-700 mb-2">Your tour is scheduled for:</p>
                                        <p className="text-xl font-bold text-blue-900">
                                            {format(new Date(booking.confirmedTourDate), "MMMM dd, yyyy")} -{" "}
                                            {format(new Date(booking.confirmedTourEndDate), "MMMM dd, yyyy")}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quote Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Booking Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Price */}
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                                    <p className="text-2xl md:text-3xl font-bold text-primary">
                                        {formatPrice(booking.paidAmount!)}
                                    </p>
                                </div>

                                <Separator />

                                {/* Inclusions */}
                                {booking.quotedInclusions &&
                                    Array.isArray(booking.quotedInclusions) &&
                                    booking.quotedInclusions.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                Included in Your Tour
                                            </h4>
                                            <ul className="space-y-2">
                                                {(
                                                    booking.quotedInclusions as Array<{ item: string; price: number | null }>
                                                ).map((inclusion, index) => (
                                                    <li key={index} className="flex items-start gap-2 text-sm">
                                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                        <span>{inclusion.item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                {/* Exclusions */}
                                {booking.quotedExclusions &&
                                    Array.isArray(booking.quotedExclusions) &&
                                    booking.quotedExclusions.length > 0 && (
                                        <>
                                            <Separator />
                                            <div>
                                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                    <XCircle className="w-4 h-4 text-red-600" />
                                                    Not Included
                                                </h4>
                                                <ul className="space-y-2">
                                                    {(
                                                        booking.quotedExclusions as Array<{
                                                            item: string;
                                                            price: number | null;
                                                        }>
                                                    ).map((exclusion, index) => (
                                                        <li key={index} className="flex items-start gap-2 text-sm">
                                                            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                            <span>{exclusion.item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </>
                                    )}

                                {/* Terms */}
                                {booking.quotedTerms && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                {booking.quotedTerms}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Dispute Details */}
                        {booking.disputeReason && (
                            <Card className="border-red-200 bg-red-50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-red-900">
                                        <AlertCircle className="h-5 w-5" />
                                        Dispute Raised
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="text-sm text-red-800">
                                            <span className="font-semibold">Reason:</span> {booking.disputeReason}
                                        </p>
                                        {booking.disputeCreatedAt && (
                                            <p className="text-xs text-red-700">
                                                Raised on {format(new Date(booking.disputeCreatedAt), "PPP")}
                                            </p>
                                        )}
                                        {!booking.disputeResolvedAt && (
                                            <p className="text-sm text-red-800 mt-2">
                                                Our support team is reviewing this dispute and will contact you shortly.
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Booking Actions */}
                        <BookingActions booking={booking} />

                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Timeline</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Booked:</span>
                                    <span className="font-medium">
                                        {format(new Date(booking.paidAt!), "MMM dd, yyyy")}
                                    </span>
                                </div>
                                {booking.tourCompletedAt && (
                                    <div className="flex justify-between">
                                        <span>Tour Completed:</span>
                                        <span className="font-medium">
                                            {format(new Date(booking.tourCompletedAt), "MMM dd, yyyy")}
                                        </span>
                                    </div>
                                )}
                                {booking.tourConfirmedAt && (
                                    <div className="flex justify-between">
                                        <span>Confirmed by You:</span>
                                        <span className="font-medium">
                                            {format(new Date(booking.tourConfirmedAt), "MMM dd, yyyy")}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div >
            </div >
        </div >
    );
}
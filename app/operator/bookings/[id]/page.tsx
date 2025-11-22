// app/operator/bookings/[id]/page.tsx
import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Calendar,
    Users,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    DollarSign,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format, isPast } from "date-fns";
import { OperatorBookingActions } from "@/components/operator/operator-booking-actions";
import { getOperatorBookingById } from "@/actions/operator/bookings";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Booking Details | SA Tours Operator",
    description: "View booking details",
};

interface OperatorBookingDetailPageProps {
    params: {
        id: string;
    };
}

export default async function OperatorBookingDetailPage({
    params,
}: OperatorBookingDetailPageProps) {
    const result = await getOperatorBookingById(params.id);

    if (!result.success) {
        if (result.error.code === 401) {
            redirect("/login");
        }
        if (result.error.code === 404) {
            notFound();
        }
        redirect("/operator/dashboard");
    }

    // Type guard to ensure data exists
    if (!result.success || !("data" in result)) {
        notFound();
    }

    const booking = result.data.booking;


    const defaultImage =
        "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=600&fit=crop";

    const totalGuests = booking.adults + booking.children;
    const canMarkComplete =
        booking.confirmedTourEndDate &&
        isPast(new Date(booking.confirmedTourEndDate)) &&
        !booking.tourCompletedByOperator;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <Button variant="ghost" asChild className="mb-6">
                    <Link href="/operator/bookings">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Bookings
                    </Link>
                </Button>

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold">Booking Details</h1>
                            <p className="text-gray-600 mt-1">
                                Reference: <span className="font-mono font-semibold">{booking.reference}</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {booking.disputeReason && <Badge variant="destructive">Disputed</Badge>}
                            {booking.tourConfirmedByCustomer && (
                                <Badge className="bg-green-600">Completed & Confirmed</Badge>
                            )}
                            {booking.tourCompletedByOperator && !booking.tourConfirmedByCustomer && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                    Awaiting Customer Confirmation
                                </Badge>
                            )}
                            {!booking.tourCompletedByOperator && (
                                <Badge variant="outline">Active Booking</Badge>
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
                                <div className="relative h-64 w-full rounded-lg overflow-hidden bg-gray-200 mb-4">
                                    <Image
                                        src={booking.tour.images?.[0] || defaultImage}
                                        alt={booking.tour.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                <h2 className="text-2xl font-bold mb-2">{booking.tour.title}</h2>
                                <p className="text-gray-600 mb-4">{booking.tour.description}</p>

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
                                        Tour Schedule
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-700 mb-2">Tour dates:</p>
                                        <p className="text-xl font-bold text-blue-900">
                                            {format(new Date(booking.confirmedTourDate), "MMMM dd, yyyy")} -{" "}
                                            {format(new Date(booking.confirmedTourEndDate), "MMMM dd, yyyy")}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Guest Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Guest Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Group Size</p>
                                    <p className="font-semibold">
                                        {booking.adults} Adult{booking.adults !== 1 ? "s" : ""}
                                        {booking.children > 0 &&
                                            `, ${booking.children} Child${booking.children !== 1 ? "ren" : ""}`}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Total: {totalGuests} guests</p>
                                </div>

                                {booking.childAges && booking.childAges.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Children&apos;s Ages</p>
                                            <p className="font-medium">{booking.childAges.join(", ")} years old</p>
                                        </div>
                                    </>
                                )}

                                {booking.specialRequirements && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Special Requirements</p>
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {booking.specialRequirements}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quote Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Booking Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Price */}
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                                    <p className="text-3xl font-bold text-primary">
                                        {formatPrice(booking.paidAmount!)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Paid on {format(new Date(booking.paidAt!), "PPP")}</p>
                                </div>

                                <Separator />

                                {/* Inclusions */}
                                {booking.quotedInclusions &&
                                    Array.isArray(booking.quotedInclusions) &&
                                    booking.quotedInclusions.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                What&apos;s Included
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
                            </CardContent>
                        </Card>

                        {/* Dispute Details */}
                        {booking.disputeReason && (
                            <Card className="border-red-200 bg-red-50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-red-900">
                                        <AlertCircle className="h-5 w-5" />
                                        Customer Dispute
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
                                            <div className="bg-red-100 border border-red-300 rounded-lg p-3 mt-3">
                                                <p className="text-sm text-red-900">
                                                    <strong>Action Required:</strong> Our admin team is reviewing this dispute.
                                                    Payment is currently on hold. We will contact you for your side of the
                                                    story.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Booking Actions */}
                        <OperatorBookingActions
                            bookingId={booking.id}
                            tourCompletedByOperator={booking.tourCompletedByOperator}
                            tourConfirmedByCustomer={booking.tourConfirmedByCustomer}
                            disputeReason={booking.disputeReason}
                            canMarkComplete={canMarkComplete}
                        />

                        {/* Payment Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Payment Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Status:</span>
                                    {booking.tourConfirmedByCustomer ? (
                                        <Badge className="bg-green-600">Released</Badge>
                                    ) : booking.disputeReason ? (
                                        <Badge variant="destructive">On Hold</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                            Pending Confirmation
                                        </Badge>
                                    )}
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Amount:</span>
                                    <span className="font-semibold">{formatPrice(booking.paidAmount!)}</span>
                                </div>
                                {booking.tourConfirmedByCustomer && booking.tourConfirmedAt && (
                                    <>
                                        <Separator />
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <p className="text-xs text-green-700 mb-1">
                                                <strong>Payment Released:</strong>
                                            </p>
                                            <p className="text-xs text-green-600">
                                                {format(new Date(booking.tourConfirmedAt), "PPP")}
                                            </p>
                                        </div>
                                    </>
                                )}
                                {!booking.tourConfirmedByCustomer && !booking.disputeReason && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-xs text-blue-700">
                                            Payment will be released once customer confirms tour completion.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

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
                                        <span>Marked Complete:</span>
                                        <span className="font-medium">
                                            {format(new Date(booking.tourCompletedAt), "MMM dd, yyyy")}
                                        </span>
                                    </div>
                                )}
                                {booking.tourConfirmedAt && (
                                    <div className="flex justify-between">
                                        <span>Customer Confirmed:</span>
                                        <span className="font-medium">
                                            {format(new Date(booking.tourConfirmedAt), "MMM dd, yyyy")}
                                        </span>
                                    </div>
                                )}
                                {booking.disputeCreatedAt && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Dispute Raised:</span>
                                        <span className="font-medium">
                                            {format(new Date(booking.disputeCreatedAt), "MMM dd, yyyy")}
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
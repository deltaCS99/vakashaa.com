// app/(customer)/bookings/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getUserQuoteRequests } from "@/actions/quote-requests";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
    title: "My Bookings | SA Tours",
    description: "View your confirmed tour bookings",
};

export default async function BookingsPage() {
    const user = await currentUser();

    if (!user) {
        redirect("/login");
    }

    const result = await getUserQuoteRequests();

    if (!result.success || !('data' in result)) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="p-8 text-center">
                    <p className="text-red-600">Failed to load bookings. Please try again.</p>
                </Card>
            </div>
        );
    }

    const confirmedBookings = result.data.quoteRequests.filter(
        (quote) => quote.status === "Paid"
    );

    const formatPrice = (priceInCents: number) => {
        const rands = priceInCents / 100;
        return `R${rands.toLocaleString('en-ZA')}`;
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                    </div>
                    <p className="text-gray-600">
                        View your confirmed tour bookings
                    </p>
                </div>

                {/* Bookings List */}
                {confirmedBookings.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">No Confirmed Bookings Yet</h3>
                                <p className="text-gray-600 mb-6">
                                    Once you accept and pay for a quote, your bookings will appear here.
                                </p>
                            </div>
                            <Button asChild size="lg">
                                <Link href="/quotes">View My Quotes</Link>
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {confirmedBookings.map((booking) => {
                            const defaultImage = "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop";

                            return (
                                <Link key={booking.id} href={`/quotes/${booking.id}`}>
                                    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full cursor-pointer">
                                        {/* Tour Image */}
                                        <div className="relative h-40 bg-gray-200">
                                            <Image
                                                src={booking.tour.images[0] || defaultImage}
                                                alt={booking.tour.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />

                                            {/* Status Badge */}
                                            <div className="absolute top-2 right-2">
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Confirmed
                                                </Badge>
                                            </div>

                                            {/* Reference Badge */}
                                            <div className="absolute top-2 left-2">
                                                <Badge variant="secondary" className="bg-white/90 backdrop-blur font-mono text-xs">
                                                    {booking.reference}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4 space-y-3">
                                            {/* Title */}
                                            <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem]">
                                                {booking.tour.title}
                                            </h3>

                                            {/* Tour Info */}
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {booking.tour.region || booking.tour.countries[0]}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                                    <span>
                                                        {new Date(booking.preferredDate).toLocaleDateString('en-ZA', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 flex-shrink-0" />
                                                    <span>
                                                        {booking.adults + booking.children} Guest{booking.adults + booking.children !== 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Price */}
                                            {booking.quotedPrice && (
                                                <div className="pt-3 border-t">
                                                    <div>
                                                        <p className="text-xs text-gray-600">Total Paid</p>
                                                        <p className="text-xl font-bold text-primary">
                                                            {formatPrice(booking.quotedPrice)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Button */}
                                            <Button variant="outline" className="w-full" asChild>
                                                <span>View Details</span>
                                            </Button>
                                        </div>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
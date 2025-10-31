// app/(public)/tours/[id]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTourById } from "@/actions/tours";
import { currentUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Calendar, Check, X, Globe, ArrowLeft } from "lucide-react";
import { QuoteRequestForm } from "@/components/tours/quote-request-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TourDetailPageProps {
    params: {
        id: string;
    };
}

export async function generateMetadata({
    params,
}: TourDetailPageProps): Promise<Metadata> {
    const result = await getTourById(params.id);

    if (!result.success || !('data' in result)) {
        return {
            title: "Tour Not Found",
        };
    }

    const tour = result.data.tour;
    return {
        title: tour.title,
        description: tour.description,
        openGraph: {
            title: tour.title,
            description: tour.description,
            images: tour.images[0] ? [tour.images[0]] : [],
        },
    };
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
    const result = await getTourById(params.id);

    if (!result.success || !('data' in result)) {
        notFound();
    }

    const { tour } = result.data;
    const user = await currentUser();
    console.log(user)

    // Format price from cents to Rands
    const formatPrice = (priceInCents: number) => {
        const rands = priceInCents / 100;
        return `R${rands.toLocaleString('en-ZA')}`;
    };

    const defaultImage = "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=600&fit=crop";

    // Get location display
    const getLocationDisplay = () => {
        if (tour.region) return tour.region;
        if (tour.countries.length === 1) return tour.countries[0];
        if (tour.countries.length > 1) return tour.countries.join(", ");
        return "Multiple Destinations";
    };

    return (
        <div className="min-h-screen bg-gray-50/50">

            <div className="container mx-auto px-4 py-8">

                {/* Back Button */}
                <Button variant="ghost" asChild className="mb-4 md:mb-6">
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Tours
                    </Link>
                </Button>
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6 pb-24 md:pb-0">{/* Added bottom padding for mobile sticky bar */}
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            {tour.images.length > 0 ? (
                                <>
                                    <div className="relative h-96 rounded-lg overflow-hidden">
                                        <Image
                                            src={tour.images[0] || defaultImage}
                                            alt={tour.title}
                                            fill
                                            className="object-cover"
                                            priority
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                                        />
                                    </div>
                                    {tour.images.length > 1 && (
                                        <div className="grid grid-cols-4 gap-2">
                                            {tour.images.slice(1, 5).map((image, index) => (
                                                <div key={index} className="relative h-24 rounded overflow-hidden">
                                                    <Image
                                                        src={image}
                                                        alt={`${tour.title} ${index + 2}`}
                                                        fill
                                                        className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                        sizes="(max-width: 768px) 25vw, 150px"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="relative h-96 rounded-lg overflow-hidden">
                                    <Image
                                        src={defaultImage}
                                        alt={tour.title}
                                        fill
                                        className="object-cover"
                                        priority
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Tour Info */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{tour.title}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    {tour.category && (
                                        <Badge variant="secondary">
                                            {tour.category}
                                        </Badge>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{getLocationDisplay()}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{tour.duration}</span>
                                    </div>
                                    {tour.maxCapacity && (
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>Max {tour.maxCapacity} people</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Description */}
                            <div>
                                <h2 className="text-xl font-semibold mb-3">About This Tour</h2>
                                <p className="text-gray-600 whitespace-pre-line">{tour.description}</p>
                            </div>

                            {/* Countries Covered */}
                            {tour.countries.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                        <Globe className="w-5 h-5" />
                                        {tour.countries.length > 1 ? "Countries Covered" : "Country"}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {tour.countries.map((country, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                                            >
                                                {country}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Destinations */}
                            {tour.destinations.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-3">Destinations & Highlights</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {tour.destinations.map((destination, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                                            >
                                                {destination}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Available Months */}
                            {tour.availableMonths.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        Best Time to Visit
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {tour.availableMonths.map((month) => (
                                            <span
                                                key={month}
                                                className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                                            >
                                                {new Date(2024, month - 1).toLocaleString('en-US', { month: 'long' })}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pickup Locations */}
                            {tour.pickupLocations && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-3">Pickup Points</h2>
                                    <div className="space-y-2">
                                        {(typeof tour.pickupLocations === 'string'
                                            ? JSON.parse(tour.pickupLocations)
                                            : tour.pickupLocations as Array<{ point: string; time: string }>
                                        ).map((pickup: { point: string; time: string }, index: number) => (
                                            <div key={index} className="flex items-center gap-2 text-gray-600">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span>{pickup.point}</span>
                                                <span className="text-gray-400">•</span>
                                                <span>{pickup.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Inclusions & Exclusions */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {tour.inclusions && Array.isArray(tour.inclusions) && tour.inclusions.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                                            <Check className="w-5 h-5 text-green-600" />
                                            What&apos;s Included
                                        </h3>
                                        <ul className="space-y-2">
                                            {(tour.inclusions as string[]).map((item, index) => (
                                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {tour.exclusions && Array.isArray(tour.exclusions) && tour.exclusions.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                                            <X className="w-5 h-5 text-red-600" />
                                            What&apos;s Not Included
                                        </h3>
                                        <ul className="space-y-2">
                                            {(tour.exclusions as string[]).map((item, index) => (
                                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Cancellation Policy */}
                            {tour.cancellationPolicy && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Cancellation Policy</h3>
                                    <p className="text-sm text-gray-700">{tour.cancellationPolicy}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quote Request Card - Desktop Only */}
                    <div className="lg:col-span-1 hidden lg:block">
                        <Card className="sticky top-24 p-6 space-y-6">
                            <div>
                                {tour.priceFrom ? (
                                    <>
                                        <p className="text-sm text-gray-600 mb-1">Indicative Pricing</p>
                                        <h3 className="text-2xl font-bold">
                                            From {formatPrice(tour.priceFrom)}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">per person</p>
                                    </>
                                ) : (
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">Custom Pricing</h3>
                                        <p className="text-sm text-gray-600">Request a personalized quote</p>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Available Dates Preview */}
                            {tour.availableDates.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Available Dates
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                        {tour.availableDates.slice(0, 6).map((date, index) => (
                                            <div
                                                key={index}
                                                className="text-sm px-3 py-2 bg-gray-50 rounded text-center"
                                            >
                                                {new Date(date).toLocaleDateString('en-ZA', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                    {tour.availableDates.length > 6 && (
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            +{tour.availableDates.length - 6} more dates
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Quote Request Form */}
                            <QuoteRequestForm
                                tour={{
                                    id: tour.id,
                                    title: tour.title,
                                    priceFrom: tour.priceFrom,
                                    availableDates: tour.availableDates,
                                    availableMonths: tour.availableMonths,
                                    maxCapacity: tour.maxCapacity,
                                }}
                                user={user}
                            />

                            <div className="text-center text-sm text-gray-500">
                                <p>✓ Free quote request</p>
                                <p>✓ No obligation</p>
                                <p>✓ Response within 24 hours</p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            {tour.priceFrom ? (
                                <>
                                    <p className="text-xs text-gray-600">Starting from</p>
                                    <p className="text-lg font-bold">{formatPrice(tour.priceFrom)}</p>
                                    <p className="text-xs text-gray-500">per person</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-semibold">Custom Pricing</p>
                                    <p className="text-xs text-gray-500">Request a quote</p>
                                </>
                            )}
                        </div>
                        <QuoteRequestForm
                            tour={{
                                id: tour.id,
                                title: tour.title,
                                priceFrom: tour.priceFrom,
                                availableDates: tour.availableDates,
                                availableMonths: tour.availableMonths,
                                maxCapacity: tour.maxCapacity,
                            }}
                            user={user}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
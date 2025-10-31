// components/tours/tour-card.tsx
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Plane } from "lucide-react";

interface TourCardProps {
  tour: {
    id: string;
    title: string;
    description: string;
    duration: string;
    priceFrom: number | null; // In cents: R2,500 = 250000
    currency: string;
    countries: string[];
    region: string | null;
    category: string | null;
    images: string[];
    maxCapacity?: number | null;
  };
}

export function TourCard({ tour }: TourCardProps) {
  // Format price from cents to Rands
  const formatPrice = (priceInCents: number) => {
    const rands = priceInCents / 100;
    return `R${rands.toLocaleString('en-ZA')}`;
  };

  const defaultImage = "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop";

  // Price display for quote-based tours
  const getPriceDisplay = () => {
    if (tour.priceFrom) {
      return (
        <>
          <span className="text-lg font-semibold">From {formatPrice(tour.priceFrom)}</span>
          <span className="text-sm text-gray-600"> pp</span>
        </>
      );
    }

    return <span className="text-sm text-gray-600">Price on Request</span>;
  };

  // Get location display
  const getLocationDisplay = () => {
    // For single country, show region or country
    if (tour.countries.length === 1) {
      return tour.region || tour.countries[0];
    }

    // For multi-country, show region if available, otherwise first country
    if (tour.countries.length > 1) {
      return tour.region || tour.countries[0];
    }

    return "Multiple Destinations";
  };

  return (
    <Link href={`/tours/${tour.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full">
        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          <Image
            src={tour.images.length > 0 ? tour.images[0] : defaultImage}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Category Badge */}
          <div className="absolute top-2 left-2 flex gap-2 z-10">
            {tour.category && (
              <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                {tour.category}
              </Badge>
            )}
          </div>

          {/* Multi-country Badge */}
          {tour.countries.length > 1 && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="default" className="bg-green-600 px-1.5 py-1 flex items-center gap-1">
                <Plane className="w-3 h-3 fill-current" />
                <span className="text-xs font-semibold">{tour.countries.length}</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem]">
            {tour.title}
          </h3>

          {/* Location & Duration */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{getLocationDisplay()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{tour.duration}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
            {tour.description}
          </p>

          {/* Price */}
          <div className="pt-2 border-t">
            <div className="flex items-baseline justify-between">
              <div className="flex flex-wrap items-baseline gap-1">
                {getPriceDisplay()}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
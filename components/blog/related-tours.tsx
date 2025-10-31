// components/blog/related-tours.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Tour {
  id: string;
  title: string;
  description: string;
  images: string[];
  priceFrom: number | null;
  currency: string;
  duration: string;
  countries: string[];
}

interface RelatedToursProps {
  tours: Tour[];
}

export function RelatedTours({ tours }: RelatedToursProps) {
  const defaultImage =
    "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop";

  const formatPrice = (priceInCents: number, currency: string) => {
    const amount = priceInCents / 100;
    return `${currency} ${amount.toLocaleString("en-ZA")}`;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Related Tours</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {tours.map((tour) => (
          <Link key={tour.id} href={`/tours/${tour.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full">
              <div className="relative h-48 bg-gray-200">
                <Image
                  src={tour.images[0] || defaultImage}
                  alt={tour.title}
                  fill
                  className="object-cover"
                />
              </div>

              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold line-clamp-2">{tour.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{tour.description}</p>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{tour.countries.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{tour.duration}</span>
                  </div>
                </div>

                {tour.priceFrom && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-600">From</p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(tour.priceFrom, tour.currency)}
                    </p>
                  </div>
                )}

                <Button className="w-full mt-2">Request Quote</Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
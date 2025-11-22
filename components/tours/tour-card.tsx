// components/tours/tour-card.tsx
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  Clock,
  Users,
  MapPin,
  Mountain,
  Building2,
  Camera,
  Wine,
  Globe2,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

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
    destinations: string[];
    inclusions: string[];
    rating?: number | null;
  };
}

export function TourCard({ tour }: TourCardProps) {

  const defaultImage =
    "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop";

  const getFlagEmoji = (country: string | undefined) => {
    if (!country) return "🌍";
    const normalized = country.toLowerCase();
    const flags: Record<string, string> = {
      "south africa": "🇿🇦",
      botswana: "🇧🇼",
      zambia: "🇿🇲",
      zimbabwe: "🇿🇼",
      namibia: "🇳🇦",
      kenya: "🇰🇪",
      tanzania: "🇹🇿",
      "united states": "🇺🇸",
      "united kingdom": "🇬🇧",
      france: "🇫🇷",
      germany: "🇩🇪",
      italy: "🇮🇹",
    };
    return flags[normalized] || "🌍";
  };

  const getScopeInfo = () => {
    if (tour.countries.length > 1) {
      const firstFlag = getFlagEmoji(tour.countries[0]);
      return { emoji: firstFlag, label: `${tour.countries.length} countries` };
    }

    if (tour.countries.length === 1) {
      const onlyCountry = tour.countries[0];
      if (!onlyCountry) return { emoji: "🌍", label: "Multi-region" };
      const flag = getFlagEmoji(onlyCountry);
      return {
        emoji: flag,
        label: onlyCountry === "South Africa" ? "Domestic" : onlyCountry,
      };
    }

    return { emoji: "🌍", label: "Multi-region" };
  };

  const getGroupSizeLabel = () => {
    if (tour.maxCapacity) {
      return `Max ${tour.maxCapacity}`;
    }
    return "Small group";
  };

  const getAreaLabel = () => {
    if (tour.region) return tour.region;
    if (tour.destinations.length > 0) return tour.destinations[0];
    if (tour.countries.length > 0) return tour.countries[0];
    return "Multiple areas";
  };

  const categoryIcons: Record<string, LucideIcon> = {
    safari: Mountain,
    "city tour": Building2,
    "scenic tour": Camera,
    "wine tour": Wine,
    "package tour": Globe2,
  };

  const getCategoryIcon = (): LucideIcon => {
    if (!tour.category) return Compass;
    const match = categoryIcons[tour.category.toLowerCase()];
    return match || Compass;
  };

  const areaLabel = getAreaLabel();
  const scopeInfo = getScopeInfo();

  const highlightSource =
    tour.destinations.length > 0 ? tour.destinations : tour.inclusions;
  const highlights = highlightSource.slice(0, 3).filter(Boolean);

  const statItems = [
    {
      icon: getCategoryIcon(),
      text: tour.category || "Tour",
    },
    { icon: Clock, text: tour.duration },
    { emoji: scopeInfo.emoji, text: scopeInfo.label },
    { icon: Users, text: getGroupSizeLabel() },
  ].filter((item) => item.text && item.text.trim().length > 0);

  return (
    <Link href={`/tours/${tour.id}`}>
      <Card className="flex flex-col overflow-hidden rounded-[18px] border-0 bg-white shadow-[0px_4px_18px_rgba(158,158,158,0.25)] transition-all duration-200 hover:-translate-y-0.5">
        <div className="relative h-[220px] w-full bg-gray-200 bg-amber-500">
          <Image
            src={tour.images.length > 0 ? tour.images[0] : defaultImage}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />
        </div>

        <div className="flex h-full flex-col gap-4 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {tour.title}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{areaLabel}</span>
            </div>
          </div>

          {statItems.length > 0 && (
            <div className="grid w-full grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
              {statItems.map(({ icon: Icon, emoji, text }, index) => (
                <div
                  key={`${text}-${index}`}
                  className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-600 text-lg">
                    {Icon ? <Icon className="h-4 w-4" /> : emoji}
                  </div>
                  <p
                    className="text-xs font-medium text-gray-700 line-clamp-2"
                    title={text}
                  >
                    {text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {highlights.length > 0 && (
            <div className="space-y-2">
              <ul className="space-y-1.5">
                {highlights.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-400" />
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="w-full border-t border-gray-100">
            {tour.priceFrom ? (
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-semibold text-gray-900">
                    {formatPrice(tour.priceFrom, tour.currency)}
                  </span>
                  <span className="text-sm text-gray-500">per person</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Price on request
                </p>
                <p className="text-sm text-gray-500">Tap to request a quote</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

// components/operator/operator-recent-quotes.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  Loader2,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { QuoteStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

interface RecentQuote {
  id: string;
  reference: string;
  status: QuoteStatus;
  preferredDate: string;
  adults: number;
  children: number;
  quotedPrice: number | null;
  createdAt: Date;
  tour: {
    id: string;
    title: string;
    images: string[];
  };
  user: {
    name: string | null;
  };
}

interface OperatorRecentQuotesProps {
  quotes: RecentQuote[];
}

const STATUS_CONFIG = {
  [QuoteStatus.Pending]: {
    label: "Pending",
    icon: Loader2,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  [QuoteStatus.Quoted]: {
    label: "Quoted",
    icon: MessageSquare,
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

export function OperatorRecentQuotes({ quotes }: OperatorRecentQuotesProps) {
  const defaultImage =
    "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop";

  const formatPrice = (priceInCents: number) => {
    const rands = priceInCents / 100;
    return `R${rands.toLocaleString("en-ZA")}`;
  };

  return (
    <div className="space-y-3">
      {quotes.map((quote) => {
        const statusConfig = STATUS_CONFIG[quote.status];
        const StatusIcon = statusConfig.icon;
        const totalGuests = quote.adults + quote.children;

        return (
          <Link key={quote.id} href={`/operator/quotes/${quote.id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer">
              <div className="flex gap-4 p-4">
                {/* Tour Image */}
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                  <Image
                    src={quote.tour.images[0] || defaultImage}
                    alt={quote.tour.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{quote.tour.title}</h3>
                      <p className="text-xs text-gray-500 font-mono">{quote.reference}</p>
                    </div>
                    <Badge variant="secondary" className={`${statusConfig.className} flex-shrink-0`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(quote.preferredDate).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{totalGuests} guests</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span>{formatDistanceToNow(new Date(quote.createdAt), { addSuffix: true })}</span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">{quote.user.name || "Customer"}</span>
                    </div>
                    {quote.quotedPrice ? (
                      <div className="text-sm font-bold text-primary">
                        {formatPrice(quote.quotedPrice)}
                      </div>
                    ) : quote.status === QuoteStatus.Pending ? (
                      <Button variant="outline" size="sm" className="h-7">
                        Respond
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
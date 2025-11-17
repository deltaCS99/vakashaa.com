// app/(customer)/quotes/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getUserQuoteRequests } from "@/actions/quote-requests";
import { QuotesList } from "@/components/quotes/quotes-list";
import { Card } from "@/components/ui/card";
import { QuoteStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "My Quotes | SA Tours",
  description: "View and manage your tour quote requests",
};

export default async function QuotesPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's quote requests
  const result = await getUserQuoteRequests();

  if (!result.success || !('data' in result)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-red-600">Failed to load quotes. Please try again.</p>
        </Card>
      </div>
    );
  }

  const { quoteRequests } = result.data;

  // Filter out booking statuses (Paid, Completed, Disputed, Refunded)
  // These should be viewed in /bookings page
  const quotePhaseRequests = quoteRequests.filter(quote =>
    ![
      QuoteStatus.Paid,
      QuoteStatus.Completed,
      QuoteStatus.Disputed,
      QuoteStatus.Refunded
    ].includes(quote.status)
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-8">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">My Quote Requests</h1>
          <p className="text-sm md:text-base text-gray-600">
            Track your tour quote requests and communicate with operators
          </p>
        </div>

        {/* Quotes List */}
        <QuotesList quoteRequests={quotePhaseRequests} />
      </div>
    </div>
  );
}
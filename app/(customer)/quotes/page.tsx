// app/(customer)/quotes/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getUserQuoteRequests } from "@/actions/quote-requests";
import { QuotesList } from "@/components/quotes/quotes-list";
import { Card } from "@/components/ui/card";

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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">My Quote Requests</h1>
          </div>
          <p className="text-gray-600">
            Track your tour quote requests and communicate with operators
          </p>
        </div>

        {/* Quotes List */}
        <QuotesList quoteRequests={quoteRequests} />
      </div>
    </div>
  );
}
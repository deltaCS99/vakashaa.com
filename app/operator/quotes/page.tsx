// app/(operator)/quotes/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOperatorProfile } from "@/lib/operator";
import { getOperatorQuoteRequests } from "@/actions/operator/quotes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { OperatorQuotesList } from "@/components/operator/operator-quotes-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Quote Requests | SA Tours Operator",
  description: "Manage your tour quote requests",
};

export default async function OperatorQuotesPage() {
  const user = await currentUser();

  if (!user || user.role !== "Operator") {
    redirect("/login");
  }

  const operatorProfile = await getOperatorProfile();

  if (!operatorProfile) {
    redirect("/operator/apply");
  }

  // Check if approved
  if (!operatorProfile.isApproved) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Account Pending Approval</h3>
                <p className="text-gray-600 mb-6">
                  Your operator account is currently under review. You&apos;ll be able to access quote
                  requests once your account is approved by our team.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch quote requests
  const result = await getOperatorQuoteRequests();

  if (!result.success || !("data" in result)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-red-600">Failed to load quote requests. Please try again.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {quoteRequests.length} Total
            </Badge>
          </div>
          <p className="text-gray-600">View and respond to customer quote requests</p>
        </div>

        {/* Quotes List */}
        <OperatorQuotesList quoteRequests={quoteRequests} />
      </div>
    </div>
  );
}
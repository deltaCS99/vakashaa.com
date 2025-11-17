// app/operator/bookings/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOperatorProfile, getOperatorProfiles, getOperatorStatus } from "@/lib/operator";
import { getOperatorBookings } from "@/actions/operator/bookings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { OperatorBookingsList } from "@/components/operator/operator-bookings-list";
import { OperatorBusinessSwitcher } from "@/components/operator/operator-business-switcher";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Bookings | SA Tours Operator",
  description: "Manage your tour bookings",
};

interface PageProps {
  searchParams: {
    business?: string;
  };
}

export default async function OperatorBookingsPage({ searchParams }: PageProps) {
  const user = await currentUser();

  if (!user || user.role !== "Operator") {
    redirect("/login");
  }

  // Get all profiles and current profile
  const allProfiles = await getOperatorProfiles();
  const operatorProfile = await getOperatorProfile(searchParams.business);

  if (!operatorProfile) {
    redirect("/operator/apply");
  }

  const status = getOperatorStatus(operatorProfile);
  const isLive = status === "live";

  // Fetch bookings
  const result = await getOperatorBookings(searchParams.business);

  if (!result.success || !("data" in result)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-red-600">Failed to load bookings. Please try again.</p>
        </Card>
      </div>
    );
  }

  const { bookings } = result.data;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-8">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Bookings</h1>
            <p className="text-sm md:text-base text-gray-600">
              Manage your confirmed tour bookings
            </p>
          </div>
          <OperatorBusinessSwitcher
            profiles={allProfiles}
            currentProfileId={operatorProfile.id}
          />
        </div>

        {/* Status Banner - Show if not live */}
        {!isLive && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-yellow-900">
                      {status === "draft" && "Not Accepting Bookings Yet"}
                      {status === "pending_review" && "Bookings Unavailable"}
                    </h3>
                    <Badge variant="outline" className="bg-white border-yellow-300">
                      {status === "draft" && "Draft Mode"}
                      {status === "pending_review" && "Under Review"}
                    </Badge>
                  </div>
                  <p className="text-sm text-yellow-800 mb-2">
                    {status === "draft" &&
                      "You'll be able to receive bookings once your business is verified and live."}
                    {status === "pending_review" &&
                      "Your business is being verified. Bookings will be available once approved."}
                  </p>
                  {status === "draft" && (
                    <Link href={`/operator/settings?tab=verification${searchParams.business ? `&business=${searchParams.business}` : ''}`}>
                      <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 mt-2">
                        Complete Verification
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookings List */}
        {isLive && <OperatorBookingsList bookings={bookings} />}
      </div>
    </div>
  );
}
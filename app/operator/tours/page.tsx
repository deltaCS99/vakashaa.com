// app/operator/tours/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOperatorProfile, getOperatorProfiles, getOperatorStatus } from "@/lib/operator";
import { getOperatorTours } from "@/actions/operator/tours";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { OperatorToursList } from "@/components/operator/operator-tours-list";
import { TourFormDialog } from "@/components/operator/tour-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperatorBusinessSwitcher } from "@/components/operator/operator-business-switcher";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Manage Tours | SA Tours Operator",
    description: "Manage your tour listings",
};

interface PageProps {
    searchParams: {
        business?: string;
    };
}

export default async function OperatorToursPage({ searchParams }: PageProps) {
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

    // Fetch tours for THIS specific business
    const result = await getOperatorTours(searchParams.business);

    if (!result.success || !("data" in result)) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Error Loading Tours</h1>
                    <p className="text-gray-600">
                        {!result.success && "error" in result
                            ? result.error.message
                            : "Failed to load tours. Please try again."}
                    </p>
                </div>
            </div>
        );
    }

    const { tours } = result.data;
    const isLive = status === "live";

    return (
        <div className="min-h-screen bg-gray-50/50 pb-8">
            <div className="container mx-auto px-4 py-4 md:py-8">
                {/* Header with Business Switcher */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Tours</h1>
                        <p className="text-sm md:text-base text-gray-600">
                            Manage your tour listings
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <OperatorBusinessSwitcher
                            profiles={allProfiles}
                            currentProfileId={operatorProfile.id}
                        />
                        {/* Desktop Create Button */}
                        <TourFormDialog mode="create" operatorProfileId={operatorProfile.id}>
                            <Button size="lg" className="hidden md:flex">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Tour
                            </Button>
                        </TourFormDialog>
                        {/* Mobile Create Button */}
                        <TourFormDialog mode="create" operatorProfileId={operatorProfile.id}>
                            <Button size="sm" className="md:hidden">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </TourFormDialog>
                    </div>
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
                                            {status === "draft" && "Tours Not Live Yet"}
                                            {status === "pending_review" && "Tours Pending Approval"}
                                        </h3>
                                        <Badge variant="outline" className="bg-white border-yellow-300">
                                            {status === "draft" && "Draft Mode"}
                                            {status === "pending_review" && "Under Review"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-yellow-800 mb-2">
                                        {status === "draft" &&
                                            "You can create and manage tours, but they won't be visible to customers until your business is verified."}
                                        {status === "pending_review" &&
                                            "Your business is being verified. Once approved, your tours will become visible to customers."}
                                    </p>
                                    {status === "draft" && (
                                        <Link href={`/operator/settings?tab=verification${searchParams.business ? `&business=${searchParams.business}` : ''}`}>
                                            <Button
                                                size="sm"
                                                className="bg-yellow-600 hover:bg-yellow-700 mt-2"
                                            >
                                                Complete Verification
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tours List */}
                <OperatorToursList
                    tours={tours}
                    operatorProfileId={operatorProfile.id}
                />
            </div>
        </div>
    );
}
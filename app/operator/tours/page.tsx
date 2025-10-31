// app/operator/tours/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOperatorProfile } from "@/lib/operator";
import { getOperatorTours } from "@/actions/operator/tours";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OperatorToursList } from "@/components/operator/operator-tours-list";
import { TourFormDialog } from "@/components/operator/tour-form-dialog";

export const metadata: Metadata = {
    title: "Manage Tours | SA Tours Operator",
    description: "Manage your tour listings",
};

export default async function OperatorToursPage() {
    const user = await currentUser();

    if (!user || user.role !== "Operator") {
        redirect("/login");
    }

    const operatorProfile = await getOperatorProfile();

    if (!operatorProfile || !operatorProfile.isApproved) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Operator Approval Pending</h1>
                    <p className="text-gray-600">
                        Your operator profile is pending approval. You&apos;ll be able to manage tours once
                        your profile is approved.
                    </p>
                </div>
            </div>
        );
    }

    // Fetch tours
    const result = await getOperatorTours();

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

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tours</h1>
                        <p className="text-gray-600">Manage your tour listings</p>
                    </div>
                    <TourFormDialog mode="create">
                        <Button size="lg">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Tour
                        </Button>
                    </TourFormDialog>
                </div>

                {/* Tours List */}
                <OperatorToursList tours={tours} operatorProfileId={operatorProfile.id} />
            </div>
        </div>
    );
}
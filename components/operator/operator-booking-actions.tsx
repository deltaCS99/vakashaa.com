// components/operator/operator-booking-actions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle, Clock } from "lucide-react";
import { markTourComplete } from "@/actions/operator/bookings";
import { toast } from "sonner";

interface OperatorBookingActionsProps {
    bookingId: string;
    tourCompletedByOperator: boolean | null;
    tourConfirmedByCustomer: boolean | null;
    disputeReason: string | null;
    canMarkComplete: boolean | null;
}

export function OperatorBookingActions({
    bookingId,
    tourCompletedByOperator,
    tourConfirmedByCustomer,
    disputeReason,
    canMarkComplete,
}: OperatorBookingActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleMarkComplete = async () => {
        setLoading(true);
        const result = await markTourComplete(bookingId);
        setLoading(false);

        if (result.success) {
            toast.success("Tour marked as complete! Customer will be notified.");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to mark tour complete");
        }
    };

    // Tour completed and confirmed
    if (tourConfirmedByCustomer) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-3" />
                        <h3 className="font-semibold text-green-900 mb-2">Tour Completed</h3>
                        <p className="text-sm text-green-700">
                            Customer confirmed tour completion. Payment has been released.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Disputed
    if (disputeReason) {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-3" />
                        <h3 className="font-semibold text-red-900 mb-2">Dispute Active</h3>
                        <p className="text-sm text-red-700 mb-3">
                            Customer has raised a dispute. Our admin team will contact you shortly.
                        </p>
                        <p className="text-xs text-red-600">Payment is currently on hold.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Waiting for customer confirmation
    if (tourCompletedByOperator) {
        return (
            <Card className="border-purple-200 bg-purple-50">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <Clock className="h-12 w-12 mx-auto text-purple-600 mb-3" />
                        <h3 className="font-semibold text-purple-900 mb-2">Awaiting Confirmation</h3>
                        <p className="text-sm text-purple-700">
                            Customer has been notified. Waiting for them to confirm tour completion or raise any
                            issues.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Can mark complete
    if (canMarkComplete) {
        return (
            <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-orange-900 mb-1">Tour Ended</h3>
                                <p className="text-sm text-orange-700 mb-3">
                                    The tour end date has passed. Please confirm if the tour was completed
                                    successfully.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleMarkComplete}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Marking Complete...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark Tour as Completed
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-center text-orange-600">
                            This will notify the customer to confirm completion
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Active booking - tour hasn't ended yet
    return (
        <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
                <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-blue-600 mb-3" />
                    <h3 className="font-semibold text-blue-900 mb-2">Active Booking</h3>
                    <p className="text-sm text-blue-700">
                        Tour is scheduled. You can mark it as complete after the tour end date.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
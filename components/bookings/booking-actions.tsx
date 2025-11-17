// components/bookings/booking-actions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertTriangle, Loader2, Star } from "lucide-react";
import { confirmTourCompletion, disputeTour } from "@/actions/bookings";
import { toast } from "sonner";
import Link from "next/link";

interface BookingActionsProps {
    booking: {
        id: string;
        tourCompletedByOperator: boolean | null;
        tourConfirmedByCustomer: boolean | null;
        disputeReason: string | null;
    };
}

export function BookingActions({ booking }: BookingActionsProps) {
    const router = useRouter();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showDisputeDialog, setShowDisputeDialog] = useState(false);
    const [disputeReason, setDisputeReason] = useState("");
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDisputing, setIsDisputing] = useState(false);

    const handleConfirm = async () => {
        setIsConfirming(true);
        const result = await confirmTourCompletion(booking.id);
        setIsConfirming(false);

        if (result.success) {
            toast.success("Tour confirmed! Thank you for your feedback.");
            setShowConfirmDialog(false);
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to confirm tour");
        }
    };

    const handleDispute = async () => {
        if (!disputeReason.trim()) {
            toast.error("Please provide a reason for the dispute");
            return;
        }

        setIsDisputing(true);
        const result = await disputeTour(booking.id, disputeReason.trim());
        setIsDisputing(false);

        if (result.success) {
            toast.success("Dispute raised. Our team will contact you shortly.");
            setShowDisputeDialog(false);
            setDisputeReason("");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to raise dispute");
        }
    };

    // Show nothing if tour not completed by operator yet
    if (!booking.tourCompletedByOperator) {
        return null;
    }

    // Already confirmed - show review option
    if (booking.tourConfirmedByCustomer) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-3" />
                        <h3 className="font-semibold text-green-900 mb-2">Tour Confirmed</h3>
                        <p className="text-sm text-green-700 mb-4">
                            Thank you for confirming your tour completion!
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href={`/tours/${booking.id}/review`}>
                                <Star className="h-4 w-4 mr-2" />
                                Leave a Review
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Already disputed
    if (booking.disputeReason) {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto text-red-600 mb-3" />
                        <h3 className="font-semibold text-red-900 mb-2">Dispute Raised</h3>
                        <p className="text-sm text-red-700">
                            Our support team is reviewing your dispute and will contact you shortly.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Needs action - show confirm/dispute options
    return (
        <>
            <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-orange-900 mb-1">Action Required</h3>
                            <p className="text-sm text-orange-700">
                                The operator has marked your tour as complete. Please confirm if everything was
                                satisfactory.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setShowConfirmDialog(true)}
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Tour Completed
                    </Button>

                    <Button
                        onClick={() => setShowDisputeDialog(true)}
                        variant="outline"
                        className="w-full border-red-600 text-red-600 hover:bg-red-50"
                    >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Raise a Dispute
                    </Button>
                </CardContent>
            </Card>

            {/* Confirm Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Tour Completion?</DialogTitle>
                        <DialogDescription>
                            By confirming, you acknowledge that the tour was completed satisfactorily and the
                            payment will be released to the operator.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                        <p className="text-sm text-blue-900">
                            ✓ Tour was completed as described
                            <br />
                            ✓ No issues with the service
                            <br />✓ Ready to release payment to operator
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isConfirming}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isConfirming ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirm Completion
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dispute Dialog */}
            <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Raise a Dispute</DialogTitle>
                        <DialogDescription>
                            Please describe the issue you experienced. Our support team will review and contact
                            you within 24 hours.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="dispute-reason">Dispute Reason *</Label>
                            <Textarea
                                id="dispute-reason"
                                placeholder="e.g., Tour guide didn't show up, accommodations were not as described, services were not provided..."
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                rows={6}
                            />
                            <p className="text-xs text-gray-500">
                                Be specific about what went wrong. This helps us resolve the issue faster.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDisputeDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDispute}
                            disabled={isDisputing || !disputeReason.trim()}
                            variant="destructive"
                        >
                            {isDisputing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Submit Dispute
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
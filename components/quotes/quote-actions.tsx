// components/quotes/quote-actions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  DollarSign,
  Ban,
  ExternalLink,
} from "lucide-react";
import { QuoteStatus } from "@prisma/client";
import { acceptQuote, rejectQuote, cancelQuoteRequest } from "@/actions/quote-requests";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface QuoteActionsProps {
  quoteRequest: {
    id: string;
    reference: string;
    status: QuoteStatus;
    quotedPrice: number | null;
    quoteExpiresAt: Date | null;
    paymentLink: string | null;
    rejectionReason: string | null;
    cancellationReason: string | null;
    createdAt: Date;
    quotedAt: Date | null;
    acceptedAt: Date | null;
    paidAt: Date | null;
  };
}

export function QuoteActions({ quoteRequest }: QuoteActionsProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");

  const formatPrice = (priceInCents: number) => {
    const rands = priceInCents / 100;
    return `R${rands.toLocaleString('en-ZA')}`;
  };

  const isExpiringSoon = quoteRequest.quoteExpiresAt && quoteRequest.status === QuoteStatus.Quoted
    ? new Date(quoteRequest.quoteExpiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
    : false;

  const handleAcceptQuote = async () => {
    setIsAccepting(true);
    try {
      const result = await acceptQuote(quoteRequest.id);
      if (result.success) {
        toast.success("Quote accepted successfully! Proceeding to payment...");
        router.refresh();
        setShowAcceptDialog(false);
      } else if (!result.success && 'error' in result) {
        toast.error(result.error.message || "Failed to accept quote");
      }
    } catch (error) {
      console.error("Error accepting quote:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsRejecting(true);
    try {
      const result = await rejectQuote(quoteRequest.id, rejectionReason);
      if (result.success) {
        toast.success("Quote rejected. The operator has been notified.");
        router.refresh();
        setShowRejectDialog(false);
      } else if (!result.success && 'error' in result) {
        toast.error(result.error.message || "Failed to reject quote");
      }
    } catch (error) {
      console.error("Error rejecting quote:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCancelRequest = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelQuoteRequest(quoteRequest.id, cancellationReason || undefined);
      if (result.success) {
        toast.success("Quote request cancelled successfully");
        router.refresh();
        setShowCancelDialog(false);
      } else if (!result.success && 'error' in result) {
        toast.error(result.error.message || "Failed to cancel request");
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Card className="sticky top-24 p-6 space-y-6">
        {/* Status-Specific Content */}
        
        {/* PENDING */}
        {quoteRequest.status === QuoteStatus.Pending && (
          <div className="text-center py-4">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-yellow-500 animate-spin" />
            <h3 className="font-semibold text-lg mb-2">Awaiting Response</h3>
            <p className="text-sm text-gray-600 mb-4">
              The operator will review your request and provide a custom quote within 24 hours.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="text-gray-600">
                Submitted {formatDistanceToNow(new Date(quoteRequest.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        )}

        {/* QUOTED */}
        {quoteRequest.status === QuoteStatus.Quoted && quoteRequest.quotedPrice && (
          <>
            <div>
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-1">Total Quote</p>
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(quoteRequest.quotedPrice)}
                </p>
              </div>

              {/* Expiry Warning */}
              {isExpiringSoon && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-orange-900">Expiring Soon!</p>
                    <p className="text-orange-700">
                      Quote expires {formatDistanceToNow(new Date(quoteRequest.quoteExpiresAt!), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}

              {quoteRequest.quoteExpiresAt && !isExpiringSoon && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Valid until</span>
                  </div>
                  <p className="text-blue-700 mt-1">
                    {new Date(quoteRequest.quoteExpiresAt).toLocaleString('en-ZA', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Accept Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={() => setShowAcceptDialog(true)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Accept Quote
            </Button>

            {/* Reject Button */}
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Quote
            </Button>
          </>
        )}

        {/* ACCEPTED */}
        {quoteRequest.status === QuoteStatus.Accepted && (
          <>
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-purple-500" />
              <h3 className="font-semibold text-lg mb-2">Quote Accepted!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Complete payment to confirm your booking.
              </p>
            </div>

            {quoteRequest.quotedPrice && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Amount Due</p>
                <p className="text-2xl font-bold">
                  {formatPrice(quoteRequest.quotedPrice)}
                </p>
              </div>
            )}

            <Separator />

            {/* Payment Button */}
            {quoteRequest.paymentLink ? (
              <Button size="lg" className="w-full" asChild>
                <a href={quoteRequest.paymentLink} target="_blank" rel="noopener noreferrer">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Pay Now
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            ) : (
              <Button size="lg" className="w-full" disabled>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Payment Link...
              </Button>
            )}

            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => setShowCancelDialog(true)}
            >
              <Ban className="w-4 h-4 mr-2" />
              Cancel Booking
            </Button>
          </>
        )}

        {/* PAID */}
        {quoteRequest.status === QuoteStatus.Paid && (
          <div className="text-center py-4">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="font-semibold text-xl mb-2">Booking Confirmed!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your tour has been confirmed. Check your email for details.
            </p>
            <div className="bg-green-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Ref:</span>
                <span className="font-mono font-semibold">{quoteRequest.reference}</span>
              </div>
              {quoteRequest.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid:</span>
                  <span>{new Date(quoteRequest.paidAt).toLocaleDateString('en-ZA')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REJECTED */}
        {quoteRequest.status === QuoteStatus.Rejected && (
          <div className="text-center py-4">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-semibold text-lg mb-2">Quote Rejected</h3>
            {quoteRequest.rejectionReason && (
              <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
                <p className="text-gray-600 mb-1 font-medium">Reason:</p>
                <p className="text-gray-700">{quoteRequest.rejectionReason}</p>
              </div>
            )}
          </div>
        )}

        {/* CANCELLED */}
        {quoteRequest.status === QuoteStatus.Cancelled && (
          <div className="text-center py-4">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="font-semibold text-lg mb-2">Request Cancelled</h3>
            {quoteRequest.cancellationReason && (
              <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
                <p className="text-gray-600 mb-1 font-medium">Reason:</p>
                <p className="text-gray-700">{quoteRequest.cancellationReason}</p>
              </div>
            )}
          </div>
        )}

        {/* EXPIRED */}
        {quoteRequest.status === QuoteStatus.Expired && (
          <div className="text-center py-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-400" />
            <h3 className="font-semibold text-lg mb-2">Quote Expired</h3>
            <p className="text-sm text-gray-600 mb-4">
              This quote has expired. Request a new quote to continue.
            </p>
            <Button size="lg" className="w-full" asChild>
              <a href={`/tours/${quoteRequest.reference}`}>Request New Quote</a>
            </Button>
          </div>
        )}

        {/* Cancel Button for Pending/Quoted */}
        {(quoteRequest.status === QuoteStatus.Pending || quoteRequest.status === QuoteStatus.Quoted) && (
          <>
            <Separator />
            <Button
              variant="ghost"
              className="w-full text-gray-600 hover:text-red-600"
              onClick={() => setShowCancelDialog(true)}
            >
              <Ban className="w-4 h-4 mr-2" />
              Cancel Request
            </Button>
          </>
        )}

        {/* Timeline */}
        <Separator />
        <div className="space-y-3 text-sm">
          <h4 className="font-semibold">Timeline</h4>
          <div className="space-y-2 text-gray-600">
            <div className="flex justify-between">
              <span>Submitted:</span>
              <span>{new Date(quoteRequest.createdAt).toLocaleDateString('en-ZA')}</span>
            </div>
            {quoteRequest.quotedAt && (
              <div className="flex justify-between">
                <span>Quoted:</span>
                <span>{new Date(quoteRequest.quotedAt).toLocaleDateString('en-ZA')}</span>
              </div>
            )}
            {quoteRequest.acceptedAt && (
              <div className="flex justify-between">
                <span>Accepted:</span>
                <span>{new Date(quoteRequest.acceptedAt).toLocaleDateString('en-ZA')}</span>
              </div>
            )}
            {quoteRequest.paidAt && (
              <div className="flex justify-between">
                <span>Paid:</span>
                <span>{new Date(quoteRequest.paidAt).toLocaleDateString('en-ZA')}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Accept Confirmation Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quote?</DialogTitle>
            <DialogDescription>
              By accepting this quote, you agree to the terms and pricing provided by the operator.
              You&apos;ll be directed to complete payment.
            </DialogDescription>
          </DialogHeader>
          {quoteRequest.quotedPrice && (
            <div className="bg-gray-50 rounded-lg p-4 my-4">
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-2xl font-bold">{formatPrice(quoteRequest.quotedPrice)}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog(false)}
              disabled={isAccepting}
            >
              Cancel
            </Button>
            <Button onClick={handleAcceptQuote} disabled={isAccepting}>
              {isAccepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Accept Quote
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quote</DialogTitle>
            <DialogDescription>
              Please let the operator know why you&apos;re rejecting this quote. This helps them improve future quotes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Price is too high, dates don't work, found another option..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectQuote}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Quote
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Request?</DialogTitle>
            <DialogDescription>
              This will cancel your quote request. You can submit a new request anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">Reason (Optional)</Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Let us know why you're cancelling..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCancelling}
            >
              Keep Request
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelRequest}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Cancel Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
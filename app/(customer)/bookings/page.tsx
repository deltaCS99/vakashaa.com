// app/(customer)/bookings/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { currentUser } from "@/lib/auth";
import { getCustomerBookings } from "@/actions/bookings";
import { BookingsList } from "@/components/bookings/bookings-list";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
    title: "My Bookings | SA Tours",
    description: "View and manage your tour bookings",
};

// Payment status alert component
function PaymentStatusAlert({
    searchParams
}: {
    searchParams: { success?: string; failed?: string; ref?: string }
}) {
    const isSuccess = searchParams.success !== undefined;
    const isFailed = searchParams.failed !== undefined;
    const reference = searchParams.ref;

    if (!isSuccess && !isFailed) return null;

    if (isSuccess) {
        return (
            <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-900 font-semibold">
                    Payment Successful!
                </AlertTitle>
                <AlertDescription className="text-green-800">
                    Your booking has been confirmed. Reference: {reference}
                    <br />
                    You will receive a confirmation email shortly.
                </AlertDescription>
            </Alert>
        );
    }

    if (isFailed) {
        return (
            <Alert className="mb-6 border-red-200 bg-red-50">
                <XCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-900 font-semibold">
                    Payment Failed
                </AlertTitle>
                <AlertDescription className="text-red-800">
                    <p className="mb-3">
                        Your payment could not be processed. Reference: {reference}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/quotes">Try Again</Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/support">Contact Support</Link>
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    return null;
}

export default async function CustomerBookingsPage({
    searchParams,
}: {
    searchParams: { success?: string; failed?: string; ref?: string };
}) {
    const user = await currentUser();

    if (!user) {
        redirect("/login");
    }

    const result = await getCustomerBookings();

    if (!result.success || !("data" in result)) {
        return (
            <div className="min-h-screen bg-gray-50/50">
                <div className="container mx-auto px-4 py-8">
                    <Card className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600">Failed to load bookings. Please try again.</p>
                        <Button className="mt-4" onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    const { bookings } = result.data;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-8">
            <div className="container mx-auto px-4 py-4 md:py-8">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        My Bookings
                    </h1>
                    <p className="text-sm md:text-base text-gray-600">
                        View and manage your confirmed tour bookings
                    </p>
                </div>

                {/* Payment Status Alert */}
                <Suspense fallback={null}>
                    <PaymentStatusAlert searchParams={searchParams} />
                </Suspense>

                {/* Bookings List */}
                <BookingsList bookings={bookings} />
            </div>
        </div>
    );
}
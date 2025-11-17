// app/(customer)/bookings/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getCustomerBookings } from "@/actions/bookings";
import { BookingsList } from "@/components/bookings/bookings-list";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "My Bookings | SA Tours",
    description: "View and manage your tour bookings",
};

export default async function CustomerBookingsPage() {
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
                        <p className="text-red-600">Failed to load bookings. Please try again.</p>
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
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
                    <p className="text-sm md:text-base text-gray-600">
                        View and manage your confirmed tour bookings
                    </p>
                </div>

                {/* Bookings List */}
                <BookingsList bookings={bookings} />
            </div>
        </div>
    );
}
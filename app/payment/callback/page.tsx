// app/payment/callback/page.tsx
import { verifyPayment } from "@/lib/paystack";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function PaymentCallback({
    searchParams,
}: {
    searchParams: { reference: string };
}) {
    const { reference } = searchParams;

    if (!reference) {
        redirect("/bookings");
    }

    try {
        // Verify payment with Paystack
        const verification = await verifyPayment(reference);

        if (verification.success) {
            // Update quote to paid
            await db.quoteRequest.updateMany({
                where: { paymentReference: reference },
                data: {
                    status: "Paid",
                    paidAt: new Date(),
                    paidAmount: verification.amount,
                },
            });

            // Redirect to bookings with success alert
            redirect(`/bookings?success=true&ref=${reference}`);
        } else {
            // Redirect to bookings with failed alert
            redirect(`/bookings?failed=true&ref=${reference}`);
        }
    } catch (error) {
        console.error("❌ Error handling payment callback:", error);
        // Redirect to bookings with failed alert
        redirect(`/bookings?failed=true&ref=${reference}`);
    }
}
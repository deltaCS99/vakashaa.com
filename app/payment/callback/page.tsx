// app/payment/callback/page.tsx
import { verifyPayment } from "@/lib/paystack";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
    sendPaymentSuccessWhatsApp,
    sendBookingConfirmationWhatsApp
} from "@/lib/whatsapp";

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
            // Find quote request
            const quoteRequest = await db.quoteRequest.findFirst({
                where: { paymentReference: reference },
            });

            if (!quoteRequest) {
                console.error("Quote request not found for reference:", reference);
                redirect(`/bookings?failed=true&ref=${reference}`);
                return;
            }

            // Update quote to paid
            await db.quoteRequest.update({
                where: { id: quoteRequest.id },
                data: {
                    status: "Paid",
                    paidAt: new Date(),
                    paidAmount: verification.amount,
                },
            });

            // Send WhatsApp notifications
            await sendPaymentSuccessWhatsApp({ quoteRequestId: quoteRequest.id });
            await sendBookingConfirmationWhatsApp({ quoteRequestId: quoteRequest.id });

            // TODO: Send email confirmations
            console.log(`✅ Payment successful for quote ${quoteRequest.reference}`);

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
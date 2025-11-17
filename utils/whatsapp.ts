

/**
 * WhatsApp message templates
 */
export const WHATSAPP_TEMPLATES = {
    // Operator templates
    operator: {
        quality_control: (operatorName: string, issues: string[]) => `Hi ${operatorName},

We noticed some areas that need attention:

${issues.map((issue) => `• ${issue}`).join("\n")}

Please update your tours to maintain quality standards.

Best regards,
SA Tours Team`,

        image_quality: (operatorName: string) => `Hi ${operatorName},

We've reviewed your tour images. Please ensure:

- Images are high resolution (min 1920x1080)
- Landscape orientation (16:9 ratio)
- Variety of shots (activities, destinations, accommodations)
- Minimum 5 images per tour

This helps improve tour visibility and bookings.

Best regards,
SA Tours Team`,

        application_approved: (operatorName: string) => `Hi ${operatorName},

Congratulations! 🎉

Your operator application has been approved. You can now:

- Create and publish tours
- Receive quote requests
- Accept bookings

Log in to get started: https://satours.co.za/operator/dashboard

Welcome to SA Tours!

Best regards,
SA Tours Team`,

        application_rejected: (operatorName: string, reason: string) => `Hi ${operatorName},

Unfortunately, we cannot approve your application at this time.

Reason: ${reason}

Please address these issues and resubmit your application.

Need help? Reply to this message or email support@satours.co.za

Best regards,
SA Tours Team`,

        bank_approved: (operatorName: string) => `Hi ${operatorName},

Your bank details have been verified! ✅

You'll now receive payouts for confirmed bookings.

Best regards,
SA Tours Team`,

        bank_rejected: (operatorName: string, reason: string) => `Hi ${operatorName},

We cannot verify your bank details.

Reason: ${reason}

Please upload a clear bank statement or confirmation letter and resubmit.

Best regards,
SA Tours Team`,
    },

    // User/Customer templates
    user: {
        quote_received: (userName: string, tourTitle: string, operatorName: string) => `Hi ${userName},

Good news! You've received a quote for "${tourTitle}" from ${operatorName}.

View and accept your quote: https://satours.co.za/quotes

Best regards,
SA Tours Team`,

        quote_accepted: (userName: string, tourTitle: string) => `Hi ${userName},

Your quote for "${tourTitle}" has been accepted! 🎉

Complete payment to confirm your booking: https://satours.co.za/quotes

Best regards,
SA Tours Team`,

        booking_confirmed: (userName: string, tourTitle: string, date: string) => `Hi ${userName},

Your booking is confirmed! ✅

Tour: ${tourTitle}
Date: ${date}

View booking details: https://satours.co.za/bookings

Have a great trip!

Best regards,
SA Tours Team`,

        payment_reminder: (userName: string, tourTitle: string) => `Hi ${userName},

Reminder: Your quote for "${tourTitle}" is waiting for payment.

Complete payment to secure your booking: https://satours.co.za/quotes

Best regards,
SA Tours Team`,
    },
};
// app/api/webhooks/paystack/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handlePaystackWebhook } from "@/lib/paystack";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get("x-paystack-signature");

        // Verify webhook signature
        const hash = crypto
            .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
            .update(body)
            .digest("hex");

        if (hash !== signature) {
            console.error("Invalid webhook signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const payload = JSON.parse(body);
        const result = await handlePaystackWebhook(payload);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
    }
}
import { NextResponse } from "next/server";
import { paymentService } from "@/services/payment-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reference, transactionId } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference code is required." },
        { status: 400 }
      );
    }

    const subscription = paymentService.verifyPayment(reference, transactionId);

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: "Subscription not found for this reference code." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription,
      message: "Payment verified successfully. Subscription is now active.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify payment." },
      { status: 500 }
    );
  }
}

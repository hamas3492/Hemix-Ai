import { NextResponse } from "next/server";
import { paymentService } from "@/services/payment-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan, userId } = body;

    if (!plan || !["pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan specified. Choose 'pro' or 'enterprise'." },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    const result = paymentService.createSubscription(userId, plan);

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      instructions: result.instructions,
      reference: result.reference,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create subscription checkout" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    // Get user from token
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { payment_id, success } = body;

    if (!payment_id) return NextResponse.json({ error: "Payment ID required" }, { status: 400 });

    // Get payment
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, booking_id")
      .eq("id", payment_id)
      .single();

    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    // Update payment status
    const newPaymentStatus = success ? "paid" : "failed";
    const newBookingStatus = success ? "confirmed" : "canceled";

    await supabaseAdmin
      .from("payments")
      .update({ status: newPaymentStatus })
      .eq("id", payment_id);

    await supabaseAdmin
      .from("bookings")
      .update({ status: newBookingStatus })
      .eq("id", payment.booking_id);

    return NextResponse.json({ message: `Payment ${newPaymentStatus}, booking ${newBookingStatus}` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
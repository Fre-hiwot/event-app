import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { payment_id, success } = await req.json();

    if (!payment_id) {
      return NextResponse.json({ error: "Payment ID required" }, { status: 400 });
    }

    // =========================
    // GET PAYMENT
    // =========================
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, booking_id")
      .eq("id", payment_id)
      .single();

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // =========================
    // GET BOOKING
    // =========================
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("id, event_id, tickets, status")
      .eq("id", payment.booking_id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // =========================
    // UPDATE PAYMENT
    // =========================
    const newPaymentStatus = success ? "paid" : "failed";
    const newBookingStatus = success ? "confirmed" : "cancelled";

    await supabaseAdmin
      .from("payments")
      .update({ status: newPaymentStatus })
      .eq("id", payment_id);

    await supabaseAdmin
      .from("bookings")
      .update({ status: newBookingStatus })
      .eq("id", booking.id);

    // =========================
    // 🔥 ONLY DECREASE TICKETS WHEN CONFIRMED
    // =========================
    if (success) {
      const { data: event } = await supabaseAdmin
        .from("events")
        .select("ticket_limit")
        .eq("id", booking.event_id)
        .single();

      if (event && event.ticket_limit !== null) {
        const newLimit = event.ticket_limit - booking.tickets;

        await supabaseAdmin
          .from("events")
          .update({
            ticket_limit: newLimit >= 0 ? newLimit : 0,
          })
          .eq("id", booking.event_id);
      }
    }

    return NextResponse.json({
      message: `Payment ${newPaymentStatus}, booking ${newBookingStatus}`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
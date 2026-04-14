import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../lib/auditLogger";

export const runtime = "nodejs"; // prevents static pre-render errors
export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      await auditLogger({
        user_id: null,
        action_type: "unauthorized",
        object_type: "booking",
        object_name: null,
        details: "Missing or invalid auth header",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Verify user token
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      await auditLogger({
        user_id: null,
        action_type: "invalid",
        object_type: "booking",
        object_name: null,
        details: "Token verification failed",
      });
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get internal user ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (profileError || !profile) {
      await auditLogger({
        user_id: user.id,
        action_type: "not_found",
        object_type: "booking",
        object_name: null,
        details: "User profile not found",
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { event_id, tickets, ticket_type } = body;

    if (!event_id || tickets == null || tickets <= 0) {
      await auditLogger({
        user_id: profile.id,
        action_type: "create_failed",
        object_type: "booking",
        object_name: `Event ${event_id}`,
        details: "Invalid input data",
      });
      return NextResponse.json(
        { error: "event_id and valid tickets are required" },
        { status: 400 }
      );
    }

    const eventIdNum = parseInt(event_id, 10);
    if (isNaN(eventIdNum)) {
      return NextResponse.json({ error: "Invalid event_id" }, { status: 400 });
    }

    // Fetch event info
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, price_regular, price_vip, price_vvip")
      .eq("id", eventIdNum)
      .single();

    if (eventError || !event) {
      await auditLogger({
        user_id: profile.id,
        action_type: "create_failed",
        object_type: "booking",
        object_name: `Event ${eventIdNum}`,
        details: `Event not found`,
      });
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Determine price
    let pricePerTicket;
    switch (ticket_type) {
      case "vip":
        pricePerTicket = event.price_vip ?? 0;
        break;
      case "vvip":
        pricePerTicket = event.price_vvip ?? 0;
        break;
      default:
        pricePerTicket = event.price_regular ?? 0;
    }

    const total_price = pricePerTicket * tickets;

    // Set booking status: free → confirmed, paid → pending
    const bookingStatus = total_price === 0 ? "confirmed" : "pending";

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert([
        {
          user_id: profile.id,
          event_id: eventIdNum,
          tickets,
          total_price,
          status: bookingStatus,
        },
      ])
      .select()
      .single();

    if (bookingError) {
      const isDuplicate = bookingError.code === "23505";

      await auditLogger({
        user_id: profile.id,
        action_type: isDuplicate ? "duplicate" : "create_failed",
        object_type: "booking",
        object_name: event.title,
        details: isDuplicate
          ? `User already booked event ${event.title}`
          : bookingError.message,
      });

      return NextResponse.json(
        {
          error: isDuplicate
            ? "You already booked this event"
            : bookingError.message,
        },
        { status: 400 }
      );
    }

    let payment = null;

    // Only create payment if not free
    if (total_price > 0) {
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert([
          {
            booking_id: booking.id,
            amount: total_price,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (paymentError) {
        // rollback booking
        await supabase.from("bookings").delete().eq("id", booking.id);

        await auditLogger({
          user_id: profile.id,
          action_type: "create_failed",
          object_type: "payment",
          object_name: event.title,
          details: paymentError.message,
        });

        return NextResponse.json(
          { error: "Failed to create payment" },
          { status: 500 }
        );
      }

      payment = paymentData;
    }

    // Success log
    await auditLogger({
      user_id: profile.id,
      action_type: "create",
      object_type: "booking",
      object_name: event.title,
      details: `Booking created (${bookingStatus}) for '${event.title}'`,
    });

    return NextResponse.json(
      {
        message:
          total_price === 0
            ? "Booking confirmed! No payment needed."
            : "Booking created. Awaiting payment.",
        booking,
        payment,
      },
      { status: 201 }
    );
  } catch (err) {
    await auditLogger({
      user_id: null,
      action_type: "error",
      object_type: "booking",
      object_name: null,
      details: err.message,
    });

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
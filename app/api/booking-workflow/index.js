import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { user_id, event_id, ticket_quantity } = await req.json();

    // 1️⃣ Get Event
    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 2️⃣ Calculate price
    const total_price = event.price * ticket_quantity;

    // 3️⃣ Create booking
    const { data: booking } = await supabase
      .from("bookings")
      .insert({
        user_id,
        event_id,
        ticket_quantity,
        total_price,
        payment_status: "completed",
      })
      .select()
      .single();

    // 4️⃣ Generate QR
    const qr_code = `QR-${booking.id}-${Date.now()}`;

    await supabase.from("tickets").insert({
      booking_id: booking.id,
      qr_code,
      is_used: false,
    });

    return NextResponse.json({
      message: "Booking successful",
      booking,
    });

  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
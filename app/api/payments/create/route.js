import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // verify user
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { booking_id } = await req.json();
    if (!booking_id) return NextResponse.json({ error: "Booking ID required" }, { status: 400 });

    // update booking to confirmed
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", booking_id)
      .eq("status", "pending")
      .select()
      .single();

    if (error || !data) return NextResponse.json({ error: "Booking not found or already paid" }, { status: 400 });

    // optionally update payment_status if you have a payments table
    await supabase.from("payments").update({ status: "paid" }).eq("booking_id", booking_id);

    return NextResponse.json({ message: "Payment successful!", booking: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
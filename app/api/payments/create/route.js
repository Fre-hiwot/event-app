import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { booking_id } = await req.json();
    if (!booking_id) return NextResponse.json({ error: "Booking ID required" }, { status: 400 });

    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("id, total_price, status")
      .eq("id", booking_id)
      .single();
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Create payment
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .insert([{
        booking_id,
        user_id: profile.id,
        amount: booking.total_price,
        status: "paid",
      }])
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update booking to confirmed
    await supabaseAdmin
      .from("bookings")
      .update({ status: "confirmed", payment_status: "paid" })
      .eq("id", booking_id);

    return NextResponse.json({ message: "Payment successful", payment }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
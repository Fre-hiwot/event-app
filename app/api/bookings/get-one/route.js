import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Booking ID required" }, { status: 400 });

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        tickets,
        total_price,
        status,
        payment_status,
        events (id, title, location, date)
      `)
      .eq("id", id)
      .single();

    if (error || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    return NextResponse.json({ booking });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
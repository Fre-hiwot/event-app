import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(req) {
  try {
    // Fetch all confirmed bookings
    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select("id, total_price, status, created_at")
      .eq("status", "confirmed")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("Admin bookings fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bookings: " + err.message },
      { status: 500 }
    );
  }
}
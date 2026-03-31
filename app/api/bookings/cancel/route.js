import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json(
        { error: "booking_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", booking_id)
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Booking cancelled successfully" },
      { status: 200 }
    );

  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
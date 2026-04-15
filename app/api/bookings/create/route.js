import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    // ================= AUTH =================
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ================= BODY =================
    const { event_id, tickets, ticket_type } = await req.json();

    if (!event_id || !tickets || tickets <= 0) {
      return NextResponse.json(
        { error: "Invalid booking request" },
        { status: 400 }
      );
    }

    const eventIdNum = Number(event_id);

    // ================= EVENT =================
    const { data: event, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        price_regular_stages,
        end_date_stages,
        price_vip,
        price_vvip,
        ticket_limit
      `)
      .eq("id", eventIdNum)
      .single();

    if (error || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // ================= PRICE LOGIC =================
    const now = new Date();
    const stages = event.price_regular_stages || {};
    const ends = event.end_date_stages || {};

    const isActive = (d) => d && new Date(d) >= now;

    let pricePerTicket = 0;

    if (ticket_type === "vip") {
      pricePerTicket = Number(event.price_vip || 0);
    } 
    else if (ticket_type === "vvip") {
      pricePerTicket = Number(event.price_vvip || 0);
    } 
    else {
      const early = Number(stages.early || 0);
      const round2 = Number(stages.round2 || 0);
      const round3 = Number(stages.round3 || 0);

      if (early > 0 && isActive(ends.early)) {
        pricePerTicket = early;
      } else if (round2 > 0 && isActive(ends.round2)) {
        pricePerTicket = round2;
      } else if (round3 > 0 && isActive(ends.round3)) {
        pricePerTicket = round3;
      }
    }

    if (pricePerTicket <= 0) {
      return NextResponse.json(
        { error: "Ticket price not available" },
        { status: 400 }
      );
    }

    const total_price = pricePerTicket * tickets;

    // ================= CREATE BOOKING =================
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert([
        {
          user_id: profile.id,
          event_id: eventIdNum,
          tickets,
          total_price,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Booking created successfully",
        booking,
      },
      { status: 201 }
    );

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
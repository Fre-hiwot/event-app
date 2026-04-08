import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../lib/auditLogger";

export async function POST(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      user_role,
      user_id,
      title,
      description,
      location,
      price_regular_stages,
      end_date_stages, // new
      price_vip,
      price_vvip,
      date,
      category_id,
      image_url,
      ticket_limit
    } = body;

    if (![5, 6].includes(user_role)) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions" },
        { status: 403 }
      );
    }

    if (!title || !date || !category_id || !ticket_limit) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prepare regular ticket pricing
    const regularPricing = {
      early: price_regular_stages?.early ? parseFloat(price_regular_stages.early) : 0,
      round2: price_regular_stages?.round2 ? parseFloat(price_regular_stages.round2) : 0,
      round3: price_regular_stages?.round3 ? parseFloat(price_regular_stages.round3) : 0
    };

    // Prepare end dates
    const endDates = {
      early: end_date_stages?.early || null,
      round2: end_date_stages?.round2 || null,
      round3: end_date_stages?.round3 || null
    };

    const { data: event, error } = await supabaseAdmin
      .from("events")
      .insert([{
        title,
        description,
        location,
        price_regular_stages: regularPricing,
        end_date_stages: endDates, // store as JSON
        price_vip: price_vip ? parseFloat(price_vip) : 0,
        price_vvip: price_vvip ? parseFloat(price_vvip) : 0,
        date,
        category_id: parseInt(category_id),
        image_url: image_url || null,
        ticket_limit: parseInt(ticket_limit),
        created_by: user_id
      }])
      .select()
      .single();

    if (error) throw error;

    await auditLogger(user_id, "create", "event", event.id, title, {
      description,
      location,
      price_regular_stages: regularPricing,
      end_date_stages: endDates,
      price_vip,
      price_vvip,
      date,
      category_id,
      ticket_limit
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("Create Event API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../lib/auditLogger";

export async function POST(req) {
  try {
    // =========================
    // AUTH CHECK
    // =========================
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      user_role,
      user_id,
      title,
      description,
      location,

      price_regular_stages,
      end_date_stages,

      price_vip,
      price_vvip,

      date,
      category_id,
      image_url,
      ticket_limit
    } = body;

    // =========================
    // REQUIRED FIELDS (ONLY WHAT YOU WANT)
    // =========================
    if (!title || !location || !date) {
      return NextResponse.json(
        {
          error: "Missing required fields: title, location, date"
        },
        { status: 400 }
      );
    }

    // =========================
    // ROLE CHECK
    // =========================
    if (![5, 6].includes(user_role)) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions" },
        { status: 403 }
      );
    }

    // =========================
    // NORMALIZE OPTIONAL DATA
    // =========================
      const safeRegularStages = {
      early: Number(price_regular_stages?.early || 0),
      round2: Number(price_regular_stages?.round2 || 0),
      round3: Number(price_regular_stages?.round3 || 0)
    };
    const safeEndDates = {
      early: end_date_stages?.early || null,
      round2: end_date_stages?.round2 || null,
      round3: end_date_stages?.round3 || null
    };

    const vip = price_vip ? Number(price_vip) : 0;
    const vvip = price_vvip ? Number(price_vvip) : 0;

    // =========================
    // INSERT EVENT
    // =========================
    const { data: event, error } = await supabaseAdmin
      .from("events")
      .insert([
        {
          title,
          description: description || null,
          location,

          date,

          // optional structured pricing
          price_regular_stages: safeRegularStages,
          end_date_stages: safeEndDates,

          price_vip: vip,
          price_vvip: vvip,

          category_id: category_id ? Number(category_id) : null,
          image_url: image_url || null,
          ticket_limit: ticket_limit ? Number(ticket_limit) : null,

          created_by: user_id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // =========================
    // AUDIT LOG
    // =========================
    await auditLogger(user_id, "create", "event", event.id, title, {
      location,
      date,
      price_regular_stages: safeRegularStages,
      end_date_stages: safeEndDates,
      price_vip: vip,
      price_vvip: vvip,
      category_id,
      ticket_limit,
      image_url
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
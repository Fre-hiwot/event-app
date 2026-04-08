import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../../lib/auditLogger";

export async function PUT(req) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    // 1️⃣ Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2️⃣ Get profile
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id, role_id")
      .eq("auth_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3️⃣ Body
    const {
      title,
      description,
      location,
      price_regular_stages,
      end_date_stages, // ✅ NEW
      price_vip,
      price_vvip,
      date,
      category_id,
      image_url,
      ticket_limit,
    } = await req.json();

    if (!id || !title || !date || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 4️⃣ Validate stage order
    const early = end_date_stages?.early;
    const round2 = end_date_stages?.round2;
    const round3 = end_date_stages?.round3;

    if (
      (early && round2 && new Date(early) >= new Date(round2)) ||
      (round2 && round3 && new Date(round2) >= new Date(round3)) ||
      (round3 && date && new Date(round3) >= new Date(date))
    ) {
      return NextResponse.json(
        { error: "Invalid stage dates: must be Early < Round2 < Round3 < Event Date" },
        { status: 400 }
      );
    }

    // 5️⃣ Duplicate check
    const { data: existing } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("location", location)
      .eq("date", date)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Another event exists at this location and date" },
        { status: 400 }
      );
    }

    // 6️⃣ Clean pricing
    const regularPricing = {
      early: price_regular_stages?.early
        ? parseFloat(price_regular_stages.early)
        : 0,
      round2: price_regular_stages?.round2
        ? parseFloat(price_regular_stages.round2)
        : 0,
      round3: price_regular_stages?.round3
        ? parseFloat(price_regular_stages.round3)
        : 0,
    };

    const endDates = {
      early: end_date_stages?.early || null,
      round2: end_date_stages?.round2 || null,
      round3: end_date_stages?.round3 || null,
    };

    // 7️⃣ Update
    let query = supabaseAdmin
      .from("events")
      .update({
        title,
        description,
        location,
        date,
        category_id: parseInt(category_id),
        image_url: image_url || null,
        ticket_limit: ticket_limit ? parseInt(ticket_limit) : 0,
        price_regular_stages: regularPricing,
        end_date_stages: endDates, // ✅ NEW
        price_vip: price_vip ? parseFloat(price_vip) : 0,
        price_vvip: price_vvip ? parseFloat(price_vvip) : 0,
      })
      .eq("id", id);

    // Organizer restriction
    if (profile.role_id === 6) {
      query = query.eq("created_by", profile.id);
    }

    const { data, error } = await query.select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Not allowed to update this event" },
        { status: 403 }
      );
    }

    // 8️⃣ Audit log
    await auditLogger({
      user_id: profile.id,
      action_type: "Update",
      object_type: "event",
      object_id: id,
      object_name: title,
      details: {
        price_regular_stages: regularPricing,
        end_date_stages: endDates,
      },
    });

    return NextResponse.json({
      message: "Event updated successfully",
      event: data[0],
    });

  } catch (err) {
    console.error(err);

    await auditLogger({
      user_id: null,
      action_type: "Server Error",
      object_type: "event",
      details: err?.message || "Unknown error",
    });

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
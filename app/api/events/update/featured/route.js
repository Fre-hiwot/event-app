import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../../lib/auditLogger";

export async function PUT(req) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    const { data: { user }, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id, role_id")
      .eq("auth_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();

    const {
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
      ticket_limit,
    } = body;

    if (!title || !date || !category_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ======================
    // SAFE STRUCTURE BUILD
    // ======================
    const regularPricing = {
      early: {
        price: Number(price_regular_stages?.early?.price || 0),
        end: end_date_stages?.early || null,
      },
      round2: {
        price: Number(price_regular_stages?.round2?.price || 0),
        end: end_date_stages?.round2 || null,
      },
      round3: {
        price: Number(price_regular_stages?.round3?.price || 0),
        end: end_date_stages?.round3 || null,
      },
    };

    const { data, error } = await supabaseAdmin
      .from("events")
      .update({
        title,
        description,
        location,
        date,
        category_id: Number(category_id),
        image_url: image_url || null,
        ticket_limit: Number(ticket_limit) || 0,

        price_regular_stages: regularPricing,

        price_vip: Number(price_vip || 0),
        price_vvip: Number(price_vvip || 0),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await auditLogger({
      user_id: profile.id,
      action_type: "Update",
      object_type: "event",
      object_id: id,
      object_name: title,
    });

    return NextResponse.json({ message: "Updated", event: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
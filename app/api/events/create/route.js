import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../lib/auditLogger";

export async function POST(req) {
  try {
    // Extract Bearer token
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
      price,
      date,
      category_id,
      image_url,
      ticket_limit
    } = body;

    // Role check
    if (![5, 6].includes(user_role)) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions" },
        { status: 403 }
      );
    }

    // Required fields
    if (!title || !date || !category_id || !ticket_limit) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert event
    const { data: event, error } = await supabaseAdmin
      .from("events")
      .insert([
        {
          title,
          description,
          location,
          price: price ? parseFloat(price) : 0,
          date,
          category_id: parseInt(category_id),
          image_url: image_url || null,
          ticket_limit: parseInt(ticket_limit),
          created_by: user_id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await auditLogger(user_id, "create", "event", event.id, title, {
      description,
      location,
      price,
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
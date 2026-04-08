// app/api/events/update/featured/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function POST(req) {
  try {
    const { event_id, is_featured } = await req.json();

    if (!event_id || typeof is_featured !== "boolean") {
      return NextResponse.json({ error: "Missing or invalid required data" }, { status: 400 });
    }

    // Optional: Check auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // Optional: Check if user is admin or organizer
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id, role_id")
      .eq("auth_id", user.id)
      .single();

    if (!profile || ![5, 6].includes(profile.role_id)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Update featured status
    const { data, error } = await supabaseAdmin
      .from("events")
      .update({ is_featured })
      .eq("id", event_id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: data }, { status: 200 });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to update featured status" }, { status: 500 });
  }
}
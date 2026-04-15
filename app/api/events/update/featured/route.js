import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../../lib/auditLogger";

export async function PUT(req) {
  try {
    // ======================
    // AUTH
    // ======================
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
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

    // ======================
    // GET USER PROFILE
    // ======================
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id, role_id")
      .eq("auth_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ======================
    // BODY
    // ======================
    const body = await req.json();
    const { event_id, is_featured } = body;

    if (!event_id || is_featured === undefined) {
      return NextResponse.json(
        { error: "event_id and is_featured required" },
        { status: 400 }
      );
    }

    // ======================
    // GET EVENT (FOR OWNERSHIP CHECK)
    // ======================
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("id, created_by, title")
      .eq("id", event_id)
      .single();

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // ======================
    // ROLE RULES
    // ======================

    const ADMIN = 5;
    const ORGANIZER = 6;

    // ❌ users not allowed
    if (![ADMIN, ORGANIZER].includes(profile.role_id)) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    // ❗ organizer can only update own event
    if (
      profile.role_id === ORGANIZER &&
      event.created_by !== profile.id
    ) {
      return NextResponse.json(
        { error: "You can only update your own events" },
        { status: 403 }
      );
    }

    // ======================
    // UPDATE FEATURED
    // ======================
    const { data, error } = await supabaseAdmin
      .from("events")
      .update({ is_featured })
      .eq("id", event_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // ======================
    // AUDIT LOG
    // ======================
    await auditLogger({
      user_id: profile.id,
      action_type: "Update",
      object_type: "event",
      object_id: event_id,
      object_name: data.title,
    });

    return NextResponse.json({
      message: "Featured status updated",
      event: data,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
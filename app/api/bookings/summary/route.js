import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../lib/auditLogger";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");

    // 🔐 Unauthorized
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      await auditLogger({
        user_id: null,
        action: "UNAUTHORIZED_ACCESS",
        details: "Missing or invalid auth header",
      });

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      await auditLogger({
        user_id: null,
        action: "INVALID_TOKEN",
        details: "Token verification failed",
      });

      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get profile (for role check)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, role_id")
      .eq("auth_id", user.id)
      .single();

    if (profileError || !profile) {
      await auditLogger({
        user_id: user.id,
        action: "USER_NOT_FOUND",
        details: "Profile not found",
      });

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔒 Optional: restrict access (example: only admin = role_id 1)
    if (profile.role_id !== 5) {
      await auditLogger({
        user_id: profile.id,
        action: "ACCESS_DENIED",
        details: "Tried to access booking summary",
      });

      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Fetch bookings
    const { data, error } = await supabase
      .from("bookings")
      .select("user_id, event:events(id, title)");

    if (error) {
      await auditLogger({
        user_id: profile.id,
        action: "FETCH_BOOKING_SUMMARY_FAILED",
        details: error.message,
      });

      throw error;
    }

    // Aggregate
    const summary = {};
    data.forEach((b) => {
      if (!b.event) return;

      if (!summary[b.event.title]) {
        summary[b.event.title] = new Set();
      }

      summary[b.event.title].add(b.user_id);
    });

    const result = {};
    for (let title in summary) {
      result[title] = summary[title].size;
    }

    // ✅ Success log
    await auditLogger({
      user_id: profile.id,
      action: "FETCH_BOOKING_SUMMARY",
      details: "Fetched booking summary report",
    });

    return NextResponse.json(result, { status: 200 });

  } catch (err) {
    await auditLogger({
      user_id: null,
      action: "SERVER_ERROR",
      details: err.message,
    });

    return NextResponse.json(
      { error: "Failed to fetch bookings summary" },
      { status: 500 }
    );
  }
}
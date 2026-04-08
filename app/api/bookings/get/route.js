import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../lib/auditLogger";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      await auditLogger({
        user_id: null,
        action: "UNAUTHORIZED_ACCESS",
        details: "Missing or invalid auth header",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id")
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

    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        tickets,
        total_price,
        status,
        created_at,
        events (
          id,
          title,
          location,
          date,
          price-regular,
          price-vip,
          price-vvip
        )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      await auditLogger({
        user_id: profile.id,
        action: "FETCH_BOOKINGS_FAILED",
        details: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings: bookings || [] }, { status: 200 });
  } catch (err) {
    await auditLogger({
      user_id: null,
      action: "SERVER_ERROR",
      details: err.message,
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
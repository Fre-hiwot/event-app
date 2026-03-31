import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../lib/auditLogger";

export async function DELETE(req) {
  try {
    const authHeader = req.headers.get("authorization");

    // 🔐 Unauthorized
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      await auditLogger({
        user_id: null,
        action_type: "UNAUTHORIZED_ACCESS",
        object_type: "category",
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
        action_type: "INVALID_TOKEN",
        object_type: "category",
        details: "Token verification failed",
      });

      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, role_id")
      .eq("auth_id", user.id)
      .single();

    if (profileError || !profile) {
      await auditLogger({
        user_id: user.id,
        action_type: "USER_NOT_FOUND",
        object_type: "category",
        details: "Profile not found",
      });

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get category id
    const { id } = await req.json();

    if (!id) {
      await auditLogger({
        user_id: profile.id,
        action_type: "DELETE_CATEGORY_FAILED",
        object_type: "category",
        details: "Missing category id",
      });

      return NextResponse.json({ error: "Missing category id" }, { status: 400 });
    }

    // Check if events exist under category
    const { data: events, error: eventsError } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("category_id", id);

    if (eventsError) {
      await auditLogger({
        user_id: profile.id,
        action_type: "DELETE_CATEGORY_FAILED",
        object_type: "category",
        details: eventsError.message,
      });

      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    if (events.length > 0) {
      await auditLogger({
        user_id: profile.id,
        action_type: "DELETE_CATEGORY_BLOCKED",
        object_type: "category",
        object_id: id,
        details: `Category ${id} has existing events`,
      });

      return NextResponse.json(
        { error: "There is an event under this category" },
        { status: 400 }
      );
    }

    // Delete query
    let query = supabaseAdmin.from("categories").delete().eq("id", id);

    // Organizer restriction
    if (profile.role_id === 6) {
      query = query.eq("created_by", profile.id);
    }

    const { data: deletedData, error: delError } = await query.select();

    if (delError) {
      await auditLogger({
        user_id: profile.id,
        action_type: "DELETE_CATEGORY_FAILED",
        object_type: "category",
        object_id: id,
        details: delError.message,
      });

      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    if (!deletedData || deletedData.length === 0) {
      await auditLogger({
        user_id: profile.id,
        action_type: "DELETE_CATEGORY_FORBIDDEN",
        object_type: "category",
        object_id: id,
        details: `User not allowed to delete category ${id}`,
      });

      return NextResponse.json(
        { error: "Not allowed to delete this category" },
        { status: 403 }
      );
    }

    // ✅ Success log
    await auditLogger({
      user_id: profile.id,
      action_type: "Delete",
      object_type: "category",
      object_id: id,
      details: `Category ${id} deleted successfully`,
    });

    return NextResponse.json({ message: "Deleted successfully" });

  } catch (err) {
    await auditLogger({
      user_id: null,
      action_type: "SERVER_ERROR",
      object_type: "category",
      details: err.message,
    });

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
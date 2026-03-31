// app/api/categories/update/[id]/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../../lib/auditLogger";

export async function PUT(req) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // extract id from URL
    const { name, description, image, user_id } = await req.json();

    if (!id || !name || !user_id) {
      await auditLogger({
        user_id: user_id || null,
        action_type: "Update Failed",
        object_type: "category",
        object_id: id || null,
        details: "Missing required fields",
      });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, role_id")
      .eq("auth_id", user_id)
      .single();

    if (profileError || !profile) {
      await auditLogger({
        user_id,
        action_type: "Update Failed",
        object_type: "category",
        object_id: id,
        details: "User profile not found",
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update query
    let query = supabaseAdmin
      .from("categories")
      .update({ name, description, image }) // include image here
      .eq("id", id);

    // Organizer can only update their own categories
    if (profile.role_id === 6) {
      query = query.eq("created_by", profile.id);
    }

    const { data, error } = await query.select();

    if (error) {
      await auditLogger({
        user_id: profile.id,
        action_type: "Update Failed",
        object_type: "category",
        object_id: id,
        details: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      await auditLogger({
        user_id: profile.id,
        action_type: "Update",
        object_type: "category",
        object_id: id,
        details: "Not allowed to update this category",
      });
      return NextResponse.json(
        { error: "Not allowed to update this category" },
        { status: 403 }
      );
    }

    // ✅ SUCCESS
    await auditLogger({
      user_id: profile.id,
      action_type: "Update",
      object_type: "category",
      object_id: id,
      object_name: name,
      details: `Category '${name}' updated successfully`,
    });

    return NextResponse.json({
      message: "Updated successfully",
      category: data[0],
    });
  } catch (err) {
    console.error("Update route error:", err);
    await auditLogger({
      user_id: null,
      action_type: "Server Error",
      object_type: "category",
      details: err?.message || "Unknown error",
    });

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../lib/auditLogger";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");

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
        details: "Profile not found in users table",
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Include image from request body
    const { name, description, image } = await req.json();

    if (!name) {
      await auditLogger({
        user_id: profile.id,
        action_type: "CREATE_CATEGORY_FAILED",
        object_type: "category",
        details: "Name is required",
      });
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert([
        {
          name,
          description,
          image, // ✅ save image URL
          organizer_id: profile.id,
        },
      ])
      .select()
      .single();

    if (error) {
      await auditLogger({
        user_id: profile.id,
        action_type: "CREATE_CATEGORY_FAILED",
        object_type: "category",
        details: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await auditLogger({
      user_id: profile.id,
      action_type: "CREATE_CATEGORY_SUCCESS",
      object_type: "category",
      object_name: name,
      details: `Category '${name}' created successfully`,
    });

    return NextResponse.json({ category: data }, { status: 201 });
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
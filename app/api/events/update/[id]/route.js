import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../../lib/auditLogger";

export async function PUT(req) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();


    // 1️⃣ Get Bearer token from headers

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];


    // 2️⃣ Get auth user from token

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

  
    // 3️⃣ Fetch user profile from DB
  
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, role_id")
      .eq("auth_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }


    // 4️⃣ Parse request body
 
    const {
      title,
      description,
      location,
      price,
      date,
      category_id,
      image_url,
    } = await req.json();

    if (!id || !title || !date || !category_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 6️⃣ Duplicate check

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
    // 7️⃣ Build update query
  
    let query = supabaseAdmin
      .from("events")
      .update({
        title,
        description,
        location,
        price: price ? parseFloat(price) : 0,
        date,
        category_id: parseInt(category_id),
        image_url,
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
      details: "Event updated successfully",
    });

    return NextResponse.json({
      message: "Event updated successfully",
      event: data[0],
    });
  } catch (err) {
    await auditLogger({
      user_id: null,
      action_type: "Server Error",
      object_type: "event",
      details: err?.message || "Unknown error",
    });

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
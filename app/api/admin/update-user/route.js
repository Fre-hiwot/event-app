// app/api/admin/update-user/route.js
import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { auditLogger } from "../../../../lib/auditLogger";

export async function PUT(req) {
  try {
    const { id, name, email, role_id, adminId } = await req.json(); // adminId = the admin performing the update

    if (!id || !name || !email) {
      return NextResponse.json(
        { error: "ID, name, and email are required" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch current user data for logging
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, name, email, role_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Update the user
    const { data, error: updateError } = await supabase
      .from("users")
      .update({ name, email, role_id })
      .eq("id", id)
      .select(); // return updated user

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 3️⃣ Log the update action
    if (adminId) {
      await auditLogger({
        user_id: adminId,                   // admin performing the action
        action_type: "update",              // create/update/delete
        object_type: "user",                // object type
        object_id: existingUser.id,         // user being updated
        object_name: existingUser.name,     // previous name
        details: {
          old_name: existingUser.name,
          old_email: existingUser.email,
          old_role: existingUser.role_id,
          new_name: name,
          new_email: email,
          new_role: role_id
        }
      });
    }

    return NextResponse.json({ success: true, user: data[0] });

  } catch (err) {
    console.error("Update User API Error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
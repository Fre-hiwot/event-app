import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { auditLogger } from "../../../../lib/auditLogger";

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { userId, adminId } = body; // adminId = the admin performing the deletion

    // 1️⃣ Validate input
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 2️⃣ Fetch user before deletion (needed for audit log)
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, name, email, role_id")
      .eq("id", userId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3️⃣ Delete user
    const { data, error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)
      .select(); // returns deleted row

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 4️⃣ Log deletion using auditLogger
    if (adminId) {
      await auditLogger({
        user_id: adminId,             // admin performing the action
        action_type: "delete",        // create/update/delete
        object_type: "user",          // object type
        object_id: existingUser.id,   // deleted user's ID
        object_name: existingUser.name, // deleted user's name
        details: { email: existingUser.email, role_id: existingUser.role_id },
      });
    }

    // 5️⃣ Success response
    return NextResponse.json(
      {
        message: "User deleted successfully",
        deletedUser: data[0],
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("Delete User Error:", err);
    return NextResponse.json({ error: "Invalid request body or server error" }, { status: 400 });
  }
}
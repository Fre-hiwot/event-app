import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../lib/auditLogger";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, role_id, admin_id } = body;

    if (!name || !email || !password || !role_id) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400 }
      );
    }

    // 1️⃣ Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400 }
      );
    }

    const authUser = authData?.user;

    if (!authUser) {
      return new Response(
        JSON.stringify({ error: "Failed to create auth user" }),
        { status: 500 }
      );
    }

    // 2️⃣ Insert into users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        auth_id: authUser.id,
        name,
        email,
        role_id,
      })
      .select()
      .single();

    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400 }
      );
    }

    // 3️⃣ Audit log
    if (admin_id) {
      await auditLogger({
        user_id: admin_id,
        action_type: "create",
        object_type: "user",
        object_id: userData.id,
        object_name: name,
        details: { email, role_id },
      });
    }

    // 4️⃣ Return result
    return new Response(JSON.stringify({ user: userData }), {
      status: 200,
    });

  } catch (err) {
    console.error("Create User API Error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected server error" }),
      { status: 500 }
    );
  }
}
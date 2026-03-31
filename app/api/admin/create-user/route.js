import { supabaseAdmin } from "../../../../lib/supabaseAdmin"; // server-side Supabase client
import { auditLogger } from "../../../../lib/auditLogger"; // centralized audit logger

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
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { status: 400 });
    }

    // 2️⃣ Insert into users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .insert({ auth_id: authData.user.id, name, email, role_id })
      .select()
      .single();

    if (userError) {
      return new Response(JSON.stringify({ error: userError.message }), { status: 400 });
    }

    // 3️⃣ Log admin action using auditLogger
    if (admin_id) {
      await auditLogger({
        user_id: admin_id,              // admin performing the action
        action_type: "create",          // create/update/delete
        object_type: "user",            // object type
        object_id: userData.id,         // the new user id
        object_name: name,              // user's name
        details: { email, role_id },    // optional extra info
      });
    }

    // 4️⃣ Return newly created user
    return new Response(JSON.stringify({ user: userData }), { status: 200 });

  } catch (err) {
    console.error("Create User API Error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected server error" }),
      { status: 500 }
    );
  }
}
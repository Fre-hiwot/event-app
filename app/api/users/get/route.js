import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(req) {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role_id, created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data || [] }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
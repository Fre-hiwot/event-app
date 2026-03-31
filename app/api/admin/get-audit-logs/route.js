import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        id,
        user_id,
        action_type,
        object_type,
        object_id,
        object_name,
        details,
        created_at,
        users!inner(id, name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ logs: data });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
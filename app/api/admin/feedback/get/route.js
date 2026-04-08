"use server";

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function GET(req) {
  try {
    const { data, error } = await supabaseAdmin
      .from("feedback")
      .select("*")          // No join needed
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ feedback: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
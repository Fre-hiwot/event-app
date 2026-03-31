import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin"; // server-side client

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // optional filter

    let query = supabaseAdmin.from("support_tickets").select("*, users!inner(id,name,email)").order("created_at", { ascending: false });
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ tickets: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to fetch tickets" }, { status: 500 });
  }
}
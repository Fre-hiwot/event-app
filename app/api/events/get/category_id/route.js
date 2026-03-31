import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

export async function GET(req) {
  try {
    // Get the query parameters
    const { searchParams } = new URL(req.url);
    const category_id = searchParams.get("category_id");

    // Build query
    let query = supabase
      .from("events")
      .select("id, title, description, date, location, category_id") // Make sure category_id is included
      .order("date", { ascending: true });

    // Filter by category_id if provided
    if (category_id) {
      query = query.eq("category_id", Number(category_id)); // Convert to number
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: data || [] }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
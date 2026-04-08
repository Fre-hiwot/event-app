import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category_id = searchParams.get("category_id");

    console.log("Received category_id:", category_id);

    // Select all fields including separate ticket prices
    let query = supabase
      .from("events")
      .select(`
        id,
        title,
        description,
        date,
        location,
        category_id,
        price_regular,
        price_vip,
        price_vvip,
        image_url,
        is_featured,
        created_at,
        created_by
      `)
      .order("date", { ascending: true });

    if (category_id) {
      query = query.eq("category_id", Number(category_id));
      console.log("Filtering by category_id:", Number(category_id));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Fetched events:", data);

    return NextResponse.json({ events: data || [] }, { status: 200 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
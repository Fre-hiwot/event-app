// app/api/event/get/featured/route.js

import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

export async function GET() {
  try {
    // Include is_featured in the select so frontend knows the status
    const { data, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        description,
        date,
        location,
        category_id,
        price_regular_stages,
        end_date_stages,
        price_vip,
        price_vvip,
        image_url,
        is_featured
      `)
      .eq("is_featured", true)
      .order("date", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { events: data || [] },
      { status: 200 }
    );

  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch featured events" },
      { status: 500 }
    );
  }
}